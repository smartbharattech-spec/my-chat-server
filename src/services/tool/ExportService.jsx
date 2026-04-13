import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * EXPORT SERVICE - Utility to capture UI elements as Images or PDF
 * Updated to include multi-page PDF generation for complete reports
 */
export const exportAsImage = async (elementId, filename = "vastu-analysis.png", options = {}) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    console.log("[ExportService] Starting export with options:", options);

    try {
        // Create a temporary wrapper for the complete report
        const tempWrapper = document.createElement("div");
        tempWrapper.id = "temp-export-wrapper";
        tempWrapper.style.position = "fixed";
        tempWrapper.style.left = "-9999px";
        tempWrapper.style.top = "0";
        tempWrapper.style.zIndex = "-1";
        tempWrapper.style.background = "#f1f5f9";
        tempWrapper.style.padding = "40px";
        tempWrapper.style.fontFamily = "'Inter', 'Segoe UI', sans-serif";
        document.body.appendChild(tempWrapper);

        // Create report root container
        const reportRoot = document.createElement("div");
        reportRoot.style.display = "flex";
        reportRoot.style.flexDirection = "column";
        reportRoot.style.alignItems = "center";
        reportRoot.style.background = "#ffffff";
        reportRoot.style.padding = "40px";
        reportRoot.style.borderRadius = "16px";
        reportRoot.style.minWidth = "1200px";
        reportRoot.style.boxShadow = "0 20px 60px rgba(0,0,0,0.1)";

        // Header
        const header = document.createElement("div");
        header.style.width = "100%";
        header.style.textAlign = "center";
        header.style.padding = "30px 0";
        header.style.marginBottom = "40px";
        header.style.borderRadius = "16px";
        header.style.background = "linear-gradient(135deg, #f97316, #fb923c)";
        header.style.color = "white";
        header.style.fontSize = "36px";
        header.style.fontWeight = "900";
        header.style.boxShadow = "0 10px 30px rgba(249, 115, 22, 0.2)";
        let titleText = "VASTU ANALYSIS REPORT";
        if (options.reportType === 'shakti') titleText = "SHAKTI CHAKRA REPORT";
        if (options.reportType === 'zone') titleText = "ZONE AREA ANALYSIS REPORT";
        if (options.reportType === 'marma') titleText = "MARMA ENERGY MAP REPORT";
        if (options.reportType === 'devta') titleText = "DEVTA MANDALA REPORT";

        header.innerHTML = titleText;
        reportRoot.appendChild(header);

        // Capture Map component
        const mapImgData = await captureElement(element);
        const mapImg = document.createElement("img");
        mapImg.src = mapImgData;
        mapImg.style.width = "100%";
        mapImg.style.height = "auto";
        mapImg.style.display = "block";
        mapImg.style.borderRadius = "8px";

        const frame = document.createElement("div");
        frame.style.width = "100%";
        frame.style.padding = "10px";
        frame.style.background = "white";
        frame.style.borderRadius = "12px";
        frame.style.display = "flex";
        frame.style.justifyContent = "center";
        frame.style.alignItems = "center";
        frame.appendChild(mapImg);
        reportRoot.appendChild(frame);

        // Add Remedy Section if requested
        if (options.includeRemedies && (options.entrances?.length > 0 || options.customZoneRemedies?.length > 0)) {
            const remedySection = createRemedySection(options.entrances, options.remedies, options.customZoneRemedies);
            reportRoot.appendChild(remedySection);
        }

        // Add Graph if requested
        if (options.reportType === 'zone' && options.graphData?.length > 0) {
            const graphSection = createGraphSection(options.graphData);
            reportRoot.appendChild(graphSection);
        }

        // Footer
        const footer = document.createElement("div");
        footer.style.marginTop = "60px";
        footer.style.textAlign = "center";
        footer.style.fontSize = "20px";
        footer.style.color = "#94a3b8";
        footer.innerHTML = `Generated on ${new Date().toLocaleDateString()} | MyVastuTool Analysis`;
        reportRoot.appendChild(footer);

        tempWrapper.appendChild(reportRoot);

        // Short delay for render
        await new Promise(r => setTimeout(r, 500));

        const canvas = await html2canvas(tempWrapper, {
            useCORS: true,
            scale: 1.5,
            backgroundColor: "#f1f5f9"
        });

        const link = document.createElement("a");
        link.download = filename;
        link.href = canvas.toDataURL("image/png");
        link.click();

        document.body.removeChild(tempWrapper);
    } catch (err) {
        console.error("Error exporting image:", err);
    }
};

// --- HELPER: CAPTURE ELEMENT AS IMAGE ---
const captureElement = async (element) => {
    const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
    });
    return canvas.toDataURL("image/png");
};

// --- HELPER: CREATE REMEDY SECTION DOM ---
const createRemedySection = (entrances = [], remedies = [], customZoneRemedies = []) => {
    const section = document.createElement("div");
    section.style.width = "100%";
    section.style.marginTop = "40px";
    section.style.padding = "30px";
    section.style.background = "#fff";
    section.style.borderRadius = "16px";
    section.style.border = "1px solid #e2e8f0";

    const positiveItems = [];
    const negativeItems = [];

    entrances.forEach((ent) => {
        let adminRemedy = remedies?.find(r => r.zone_code === ent.zone && r.category === (ent.category || 'Entrance'));
        let isPositive = adminRemedy ? Number(adminRemedy.is_positive) === 1 : true;
        
        // If it's technically a 'Negative' zone but has a custom remedy, it's still negative in terms of 'observation'
        if (isPositive) {
            positiveItems.push(ent);
        } else {
            negativeItems.push({ ...ent, adminRemedy });
        }
    });

    let html = `
        <div style="border-bottom:4px solid #f97316;margin-bottom:30px;padding-bottom:15px;text-align:center;">
            <div style="font-size:32px;font-weight:900;color:#1e293b;letter-spacing:-0.5px;">Vastu Analysis & Remediations</div>
            <div style="font-size:14px;color:#64748b;margin-top:5px;font-weight:600;text-transform:uppercase;">Detailed breakdown of all marked components</div>
        </div>
    `;

    // 1. POSITIVE OBSERVATIONS
    if (positiveItems.length > 0) {
        html += `
            <div style="margin-bottom:40px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <div style="width:32px;height:32px;background:#22c55e;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;">✓</div>
                    <div style="font-size:24px;font-weight:900;color:#166534;">Strategic Positive Placements</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                    ${positiveItems.map((ent, idx) => `
                        <div style="padding:15px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;display:flex;align-items:center;gap:12px;">
                            <div style="font-weight:900;color:#166534;font-size:18px;">${idx + 1}.</div>
                            <div>
                                <div style="font-weight:800;font-size:15px;color:#14532d;">${ent.specification || ent.category || 'Component'}</div>
                                <div style="font-size:12px;color:#166534;font-weight:600;opacity:0.8;">ZONE: ${ent.zone} | Well Placed</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 2. NEGATIVE OBSERVATIONS & REMEDIES
    if (negativeItems.length > 0 || customZoneRemedies.length > 0) {
        html += `
            <div style="margin-bottom:40px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <div style="width:32px;height:32px;background:#ef4444;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;">!</div>
                    <div style="font-size:24px;font-weight:900;color:#991b1b;">Corrective Remedies Required</div>
                </div>
        `;

        negativeItems.forEach((ent, idx) => {
            let remedyText = (ent.useCustomRemedy ? ent.customRemedy : ent.adminRemedy?.remedy) || ent.customRemedy || "Consult Vastu expert for specific remedy protocols.";
            
            html += `
                <div style="padding:24px;margin-bottom:20px;background:#fef2f2;border-radius:16px;border-left:8px solid #ef4444;box-shadow:0 4px 6px -1px rgba(239, 68, 68, 0.05);">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                        <div style="font-weight:900;font-size:20px;color:#991b1b;">${ent.specification || ent.category || 'Component'} (Zone: ${ent.zone})</div>
                        <div style="display:flex;gap:5px;">
                            <div style="background:#fee2e2;color:#991b1b;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;border:1px solid #fecaca;text-transform:uppercase;">Remedy Prescribed</div>
                            <div style="background:#fff;color:#991b1b;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;border:1px solid #fecaca;text-transform:uppercase;">Source: ${ent.useCustomRemedy ? "Custom (Expert)" : (ent.adminRemedy?.expert_id ? "Expert" : "Admin")}</div>
                        </div>
                    </div>
                    <div style="font-size:16px;line-height:1.6;color:#451a03;background:rgba(255,255,255,0.5);padding:15px;border-radius:8px;">
                        <b style="color:#92400e;display:block;margin-bottom:5px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Recommended Action:</b>
                        ${remedyText}
                    </div>
                </div>
            `;
        });

        // Add special zone remedies here too
        customZoneRemedies.forEach((remedy) => {
            html += `
                <div style="padding:24px;margin-bottom:20px;background:#fff7ed;border-radius:16px;border-left:8px solid #f97316;box-shadow:0 4px 6px -1px rgba(249, 115, 22, 0.05);">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                        <div style="font-weight:900;font-size:20px;color:#9a3412;">Special Zone Remedy (Zones: ${remedy.zones.join(', ')})</div>
                        <div style="background:#fff7ed;color:#9a3412;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;border:1px solid #ffedd5;text-transform:uppercase;">Source: Expert</div>
                    </div>
                    <div style="font-size:16px;line-height:1.6;color:#451a03;background:rgba(255,255,255,0.5);padding:15px;border-radius:8px;font-style:italic;">
                        ${remedy.remedy}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    }

    if (positiveItems.length === 0 && negativeItems.length === 0 && customZoneRemedies.length === 0) {
        html += `<div style="text-align:center;padding:40px;color:#94a3b8;font-style:italic;">No components marked for analysis yet.</div>`;
    }

    section.innerHTML = html;
    return section;
};

// --- HELPER: CREATE GRAPH SECTION DOM ---
const createGraphSection = (graphData) => {
    const section = document.createElement("div");
    section.style.width = "100%";
    section.style.marginTop = "40px";
    section.style.padding = "30px";
    section.style.background = "#fff";
    section.style.borderRadius = "16px";
    
    section.innerHTML = `
        <div style="border-bottom:4px solid #10b981;margin-bottom:30px;padding-bottom:15px;">
            <div style="font-size:32px;font-weight:900;color:#1e293b;">Area Distribution Analysis</div>
        </div>
        <div style="display:flex;align-items:flex-end;height:300px;gap:10px;padding:20px;border-bottom:2px solid #e2e8f0;">
            ${graphData.map(d => `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;">
                    <div style="width:100%;height:${d.percent};background:${d.color || '#10b981'};border-radius:4px 4px 0 0;"></div>
                    <div style="font-size:10px;font-weight:bold;margin-top:5px;transform:rotate(-45deg);white-space:nowrap;">${d.zone}</div>
                </div>
            `).join('')}
        </div>
    `;
    return section;
};

/**
 * NEW: EXPORT COMPLETE MULTI-PAGE PDF
 */
export const exportCompleteReportPDF = async (data = {}) => {
    console.log("[ExportService] Generating Complete Report PDF...");
    const { 
        filename = "Vastu-Complete-Report.pdf",
        pages = [] // Array of { title, elementId, imgData, options }
    } = data;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (i > 0) pdf.addPage();

        // 1. Header for each page
        pdf.setFillColor(249, 115, 22); // Orange
        pdf.rect(0, 0, pdfWidth, 25, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text(page.title.toUpperCase(), 15, 17);

        // 2. Capture Content
        let currentImgData = page.imgData;

        if (!currentImgData && page.elementId) {
            const element = document.getElementById(page.elementId);
            if (element) {
                try {
                    const canvas = await html2canvas(element, {
                        useCORS: true,
                        scale: 2,
                        backgroundColor: "#ffffff",
                        logging: false
                    });
                    currentImgData = canvas.toDataURL('image/jpeg', 0.85);
                } catch (err) {
                    console.error(`Error capturing page ${page.title}:`, err);
                }
            }
        }

        if (currentImgData) {
            try {
                const imgProps = pdf.getImageProperties(currentImgData);
                const ratio = imgProps.width / imgProps.height;
                
                // Scale image to fit within safe area
                const availableHeight = pdfHeight - 45; // 25 header + 10 footer + margins
                const availableWidth = pdfWidth - 30; // 15 margins
                
                let renderWidth = availableWidth;
                let renderHeight = renderWidth / ratio;
                
                if (renderHeight > availableHeight) {
                    renderHeight = availableHeight;
                    renderWidth = renderHeight * ratio;
                }

                pdf.addImage(currentImgData, 'JPEG', (pdfWidth - renderWidth) / 2, 35, renderWidth, renderHeight);
            } catch (err) {
                console.error(`Error adding image to PDF for page ${page.title}:`, err);
            }
        } else {
            pdf.setTextColor(150, 150, 150);
            pdf.setFontSize(12);
            pdf.text("Content not available for this section.", 15, 45);
        }

        // 4. Footer
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`MyVastuTool Analysis | Page ${i + 1} of ${pages.length}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
    }

    pdf.save(filename);
};

/**
 * Capture any element and return its dataURL
 */
export const captureElementAsImage = async (elementId, options = {}) => {
    const element = document.getElementById(elementId);
    if (!element) return null;
    try {
        const canvas = await html2canvas(element, {
            useCORS: true,
            scale: 2,
            backgroundColor: options.backgroundColor || "#ffffff",
            logging: false
        });
        return canvas.toDataURL('image/jpeg', options.quality || 0.85);
    } catch (err) {
        console.error(`Error in captureElementAsImage for ${elementId}:`, err);
        return null;
    }
};

export const exportAsPDF = async (elementId, filename = "vastu-analysis.pdf") => {
    // Legacy fallback
    await exportAsImage(elementId, filename.replace('.pdf', '.png'));
};
