import HomeLayout from "../../../layouts/HomeLayout";
import CoursePage from "../../dashboard/AdminFeatures/CoursesPage"; // ✅ adjust the import path if different

const InstructorCoursesPage = () => {
  return (
    <HomeLayout>
      <CoursePage />
    </HomeLayout>
  );
};

export default InstructorCoursesPage;
