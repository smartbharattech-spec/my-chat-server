import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthService';

export const usePlanPermissions = () => {
    // Current state, defaults to true (allow all) while loading to avoid flickering lock
    // or false if critical. Let's strictly default to false until loaded.
    const [allowedTools, setAllowedTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        const fetchPermissions = async () => {
            if (!isLoggedIn) {
                setLoading(false);
                return;
            }

            const email = localStorage.getItem("email");
            const activeProjectId = localStorage.getItem("active_project_id");
            if (!email) {
                setLoading(false);
                return;
            }

            try {
                let projectPlanId = null;
                let projectPlanName = null;
                let userPlanId = null;
                let userPlanName = null;

                // 1. Check Active Project Plan
                if (activeProjectId) {
                    const projectRes = await fetch(`/api/projects.php?action=check&email=${email}&id=${activeProjectId}`);
                    const projectData = await projectRes.json();
                    if (projectData.status === "success" && projectData.purchased) {
                        projectPlanId = projectData.plan_id;
                        projectPlanName = projectData.plan_name;
                    }
                }

                // 2. Fetch User Profile Plan
                const profileRes = await fetch("/api/user_profile.php", {
                    method: "POST",
                    body: JSON.stringify({ action: "fetch", email })
                });
                const profileData = await profileRes.json();
                if (profileData.status && profileData.data) {
                    userPlanId = profileData.data.plan_id;
                    userPlanName = profileData.data.plan;
                }

                if (projectPlanId || projectPlanName || userPlanId || userPlanName) {
                    // 3. Fetch All Plans to match allowed tools
                    const plansRes = await fetch("/api/plans.php");
                    const plansData = await plansRes.json();

                    if (plansData.status === "success") {
                        const allPlans = plansData.data;
                        let combinedTools = new Set();

                        // Helper to add tools from a plan match
                        const getPlan = (id, name) => {
                            return allPlans.find(p =>
                                (id && String(p.id) === String(id)) ||
                                (name && p.title === name)
                            );
                        };

                        const projectPlan = getPlan(projectPlanId, projectPlanName);
                        const userPlan = getPlan(userPlanId, userPlanName);

                        if (projectPlan) {
                            (projectPlan.allowed_tools || []).forEach(t => combinedTools.add(Number(t)));
                        }

                        // ONLY add user-level tools if no project-level tools were found
                        if (combinedTools.size === 0 && userPlan) {
                            (userPlan.allowed_tools || []).forEach(t => combinedTools.add(Number(t)));
                        }

                        if (combinedTools.size > 0) {
                            // Always ensure Tool 1 (Center) is allowed if any other tool is allowed,
                            // as it is a prerequisite for all other tools.
                            combinedTools.add(1);
                            setAllowedTools(Array.from(combinedTools));
                        } else {
                            // If a plan is assigned but not found (orphaned), or has empty tool list,
                            // default to allowing all core tools [1,2,3,4,5,6,8].
                            setAllowedTools([1, 2, 3, 4, 5, 6, 8]);
                        }
                    } else {
                        // Fallback if plans API fails but we know they have a plan
                        setAllowedTools([1, 2, 3, 4, 5, 6, 8]);
                    }
                } else {
                    setAllowedTools([]);
                }
            } catch (error) {
                console.error("Failed to fetch permissions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, [isLoggedIn]); // We could add activeProjectId here if needed, but remounting VastuToolScreen handles it too

    return { allowedTools, loading };
};
