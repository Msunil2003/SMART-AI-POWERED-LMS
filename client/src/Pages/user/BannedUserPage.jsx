import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import option2 from '../../assets/json/option2.json';
import Particle from "../../components/Particle";
import HomeLayout from '../../layouts/HomeLayout';

const BannedUserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state;

  useEffect(() => {
    if (!user || !user.banReason || !user.banMessage) {
      navigate('/');
    }
  }, [user, navigate]);

  const {
    name,
    email,
    subscription,
    banReason,
    banMessage
  } = user || {};

  // ✅ FIXED: Check subscription.status instead of treating it like a string
  const isActive = subscription?.status?.toLowerCase() === 'active';

  return (
    <HomeLayout>
      <Particle option={option2} />
      <div className="min-h-screen flex justify-center items-center px-4 py-10">
        <div className="bg-white/30 backdrop-blur-md p-8 rounded-xl max-w-3xl text-center shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-red-700">
            Dear {name},
          </h1>
          <p className="text-lg mb-4 text-gray-800">
            You are <span className="font-bold text-red-600">banned</span> from using the <strong>Smart LMS Portal</strong> due to the violation of our rules.
          </p>

          <p className="text-lg font-semibold text-left mb-4 text-gray-900 underline">
            Here is your info as per our database:
          </p>

          <div className="text-left mb-6 text-gray-800 text-lg">
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Subscription:</strong> {isActive ? 'Active' : 'Inactive'}</p>
            <p><strong>Reason:</strong> {banReason}</p>
            <p><strong>Message from Admin:</strong> {banMessage}</p>
          </div>

          <div className="text-gray-800 text-justify text-[1.1rem] leading-7">
            {isActive ? (
              <>
                <p className="mb-3">
                  We inform you that you have been banned from the Smart LMS Portal. If you want your refund or to revoke the restriction from the portal, mail us from your registered mail ID at <strong>admin.smartlms@gmail.com</strong>.
                </p>
                <p className="mb-6">
                  We will process your request and based on your decision we will process the request from our end.
                </p>
              </>
            ) : (
              <>
                <p className="mb-6">
                  We inform you that you have been banned from the Smart LMS Portal. If you want to revoke the restriction from the portal, mail us from your registered mail ID at <strong>admin.smartlms@gmail.com</strong>.
                  <br /><br />
                  We will process your request and based on your decision we will process the request from our end.
                </p>
              </>
            )}

            <p className="font-semibold">
              Thanks and regards,<br />
              Admin<br />
              Smart LMS
            </p>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default BannedUserPage;
