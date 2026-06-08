import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';



const Loading = ({ verifyPayment = false }) =>{

  const navigate = useNavigate()
  const { axios, token, fetchUser } = useAppContext();

  useEffect(() =>{
    if (!verifyPayment) {
      return;
    }

    const verifyPurchase = async () => {
      const sessionId = new URLSearchParams(window.location.search).get('session_id');

      try {
        if (sessionId && token) {
          const { data } = await axios.post('/api/credit/verify', { sessionId }, {
            headers: { Authorization: token }
          });

          if (data.success) {
            await fetchUser();
            toast.success('Credits added successfully');
          } else {
            toast.error(data.message || 'Payment verification failed');
          }
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        navigate('/');
      }
    };

    verifyPurchase();
  },[axios, fetchUser, navigate, token, verifyPayment])

  return(
    <div className="bg-gradient-to-b from-[#531B81] to-[#29184B] backdrop-opacity-60 flex items-center justify-center h-screen w-screen text-white text-2xl">
      <div className="w-10 h-10 rounded-full border-3 border-white border-t-transparent animate-spin">

      </div> 
    </div>
  )
}

export default Loading;
