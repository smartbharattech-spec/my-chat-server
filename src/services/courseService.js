import axios from 'axios';

const API_URL = '/api/courses.php';

const courseService = {
    getCourses: async () => {
        const res = await axios.get(API_URL);
        return res.data;
    },
    getCourseById: async (id) => {
        const res = await axios.get(`${API_URL}?id=${id}`);
        return res.data;
    },
    saveCourse: async (formData) => {
        const res = await axios.post(API_URL, formData);
        return res.data;
    },
    deleteCourse: async (id) => {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('action', 'delete');
        const res = await axios.post(API_URL, formData);
        return res.data;
    },
    purchaseCourse: async (courseId, paymentMethod, transactionId) => {
        // Implementation for purchase API
        const res = await axios.post('/api/purchase_course.php', { courseId, paymentMethod, transactionId });
        return res.data;
    }
};

export default courseService;
