// eslint-disable-next-line no-unused-vars
import { Link } from "react-router-dom";

import HomeImage from "../assets/Images/homeImage.png";
import option1 from '../assets/json/option1.json';
import Particle from "../components/Particle";
import HomeLayout from "../layouts/HomeLayout";

const HomePage = () => {
    return (
        <HomeLayout>
            <Particle option={option1} />
            <div className="min-h-screen flex lg:px-8 px-4 pb-8 lg:pb-0 flex-col lg:flex-row justify-around items-center">
                <div className="lg:px-4 md:px-4 space-y-6 lg:w-1/2">
                    <h1 className="lg:text-5xl text-2xl text-white font-semibold">
                        Empowering Education with <span className="text-yellow-500 font-bold">AI-Powered Smart LMS</span>
                    </h1>

                    <p className="text-gray-200 lg:text-lg tracking-wider">
                        Smart LMS is a cutting-edge Learning Management System engineered to redefine how learning is delivered, assessed, and personalized. Powered by advanced AI algorithms, it combines adaptive technologies, intelligent automation, and real-time analytics to deliver an immersive educational experience for students, instructors, and institutions alike.
                    </p>

                    <div className="space-y-6 text-gray-200 lg:text-lg tracking-wider">

                        <div>
                            <h2 className="text-xl font-semibold text-yellow-400">AI-Driven Content Delivery</h2>
                            <p>
                                Our Smart LMS tailors content based on each student's learning behavior, pace, and emotional state. The system generates contextual summaries, highlights key concepts, and even adjusts delivery methods—text, voice, or visual—based on individual preferences. Emotion-responsive learning ensures that content adapts not just to performance, but also to learner engagement and mood.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-yellow-400">AI-Based Test Generation</h2>
                            <p>
                                Say goodbye to static assessments. The platform uses natural language processing to analyze course material and automatically generate quizzes and tests. Questions are crafted using Bloom’s taxonomy, ensuring a well-balanced assessment strategy that evaluates comprehension, application, and critical thinking.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-yellow-400">Proctored Online Exams</h2>
                            <p>
                                Ensuring exam integrity, our proctoring system monitors webcam, microphone, and screen activity using AI-powered detection. It identifies anomalies such as eye movement, background noise, multiple faces, or screen switching, generating detailed violation reports while maintaining user privacy and system performance.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-yellow-400">Adaptive Learning Engine</h2>
                            <p>
                                The adaptive engine continuously monitors learner progress, behavior, and response patterns. Based on this analysis, it adjusts the difficulty of content, prioritizes weaker areas, and suggests personalized learning paths. This dynamic approach empowers students to improve at their own pace, with confidence and clarity.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-yellow-400">AI Chat Assistant</h2>
                            <p>
                                Our voice-enabled, role-based assistant is available 24/7 to help students with doubts, instructors with task automation, and admins with operational support. Integrated with OpenAI and contextual memory, it understands user intent and provides natural, conversational assistance across the platform.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-yellow-400">AI-Powered Interview Simulator</h2>
                            <p>
                                Preparing students for real-world interviews, this module simulates diverse scenarios across domains. From behavioral interviews to domain-specific challenges, the AI generates questions and evaluates responses using the STAR method. Personalized feedback enhances communication skills, confidence, and professionalism.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-yellow-400">Collaborative Coding Arena</h2>
                            <p>
                                Technical learners benefit from a real-time collaborative coding space, enabling pair programming, mentor guidance, and live problem-solving. Integrated AI reviews code for efficiency, syntax, and logic while encouraging best practices, making learning interactive and industry-aligned.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-yellow-400">Intelligent Performance Analytics</h2>
                            <p>
                                Comprehensive dashboards offer insights into academic progress, emotional trends, and behavioral patterns. Instructors can detect learning gaps early, while students receive actionable feedback and achievement badges. Institutional leaders benefit from macro-level insights to make data-informed decisions.
                            </p>
                        </div>

                    </div>
                </div>

                <div>
                    <img src={HomeImage} alt="Smart LMS Illustration" className="bg-transparent w-full h-full" />
                </div>
            </div>
        </HomeLayout>
    );
};

export default HomePage;
