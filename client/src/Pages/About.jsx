import aboutMainImage from '../assets/Images/aboutMainImage.png';
import option2 from '../assets/json/option2.json';
import Carousel from '../components/Carousel';
import Particle from '../components/Particle';
import HomeLayout from '../layouts/HomeLayout';

function About() {
    return (
        <HomeLayout>
            <Particle option={option2} />
            <div className='flex flex-col lg:p-16 p-8'>
                <section className='flex lg:flex-row flex-col items-center justify-between w-full'>
                    <div className='flex flex-col gap-16 lg:w-[70%] w-full'>
                        <h1 className='lg:text-5xl text-3xl font-bold text-yellow-500 text-center lg:text-left'>
                            Empowering Education with Intelligence
                        </h1>
                        <p className='lg:text-2xl text-xl text-slate-500 font-semibold text-center lg:text-left'>
                            Our Smart Learning Management System (Smart LMS) is designed to revolutionize digital education by integrating artificial intelligence with modern pedagogical practices. We aim to provide an intelligent, adaptive, and accessible platform that fosters personalized learning experiences for students and empowers educators with advanced teaching tools. 
                            <br /><br />
                            With features like AI-driven content creation, real-time performance analytics, emotion-aware learning environments, and collaborative coding arenas, we strive to create an inclusive ecosystem where knowledge is dynamic, engaging, and impactful.
                        </p>
                    </div>
                    <div className='lg:w-[30%] drop-shadow-2xl'>
                        <img src={aboutMainImage} alt="Smart LMS Illustration" className='bg-transparent' />
                    </div>
                </section>

                <section className='pt-4 w-full lg:w-[80%] lg:mx-auto'>
                    <Carousel />
                </section>
            </div>
        </HomeLayout>
    );
}

export default About;
