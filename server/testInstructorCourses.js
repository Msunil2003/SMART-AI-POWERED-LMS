import axios from 'axios';

const TEST_TOKEN = 'weghibrgjksghwiusghkjbhkkgbkjbhjhgbiuyewrjkbhkjbhvigiibujhkjbdsiughikghbujhikujhbiiugbikgbbsdbiuiudfibjiksdbiugbiugb'; // Replace with your logged-in instructor token

const fetchInstructorCourses = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/v1/course/instructor/my-courses', {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
    });

    console.log('Status:', response.status);
    console.log('Message:', response.data.message);
    console.log('Courses:', response.data.courses);
  } catch (error) {
    console.error('Error fetching courses:', error.response?.data || error.message);
  }
};

fetchInstructorCourses();
