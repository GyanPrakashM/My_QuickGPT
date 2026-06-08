import { useAppContext } from '../context/AppContext';
import { useState } from 'react';
import { useEffect } from 'react';
import {assets} from '../assets/assets';
import Message from './Message'
import { useRef } from 'react';
import toast from 'react-hot-toast';

const ChatBox = () =>{

  const containerRef = useRef(null);

  const {selectedChat , theme , user , axios , token , setUser} = useAppContext();

  const [messages , setMessages] = useState([])
  const [loading , setLoading] = useState(false);

  const [prompt , setPrompt] = useState('');
  const [mode , setMode] = useState('text');
  const [isPublished , setIsPublished] = useState(false);

  const onSubmit = async (e) =>{
      e.preventDefault();
      const promptCopy = prompt;
      try{
        if(!user) return toast('Login to send message');
        if(!selectedChat?._id) return toast.error('Create or select a chat first');
        setPrompt('');
        setLoading(true);
        setMessages(prev => [...prev, {role:'user', content:prompt , timestamp:Date.now(),isImage:false}])
 
        const {data} = await axios.post(`/api/message/${mode}`,{chatId:selectedChat._id , prompt ,isPublished }, {headers:{Authorization:token}} )
        if(data.success){
          setMessages(prev=> [...prev , data.reply])

          if(mode === 'image'){
            setUser(prev => ({...prev, credits: prev.credits - 2}))
          }else {
            setUser(prev => ({...prev, credits: prev.credits - 1}))
          }
        }else {
          toast.error(data.message)
          setPrompt(promptCopy);
        }
     }catch(error){
        toast.error(error.message)
        setPrompt(promptCopy);
      }finally{
        setLoading(false);
      }
  }

  useEffect(()=>{
    if(selectedChat){
      setMessages(selectedChat.messages);
    }
  },[selectedChat])

  useEffect(()=>{
    if(containerRef.current){
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }

  },[messages])
   return(
    <div className="flex-1 min-w-0 max-w-full overflow-hidden flex flex-col justify-between px-3 sm:px-5 lg:px-6 py-5 md:py-8 max-md:pt-14">
      <div ref={containerRef} className='flex-1 min-w-0 mb-5 overflow-y-auto overflow-x-hidden w-full max-w-4xl mx-auto'>
        {messages.length === 0 && (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-primary">
            <img src={theme ===  'dark' ? assets.logo_full : assets.logo_full_dark} alt="" className="w-full max-w-56 sm:max-w-68" />
            <p className="mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white">Ask me anything.</p>
          </div>
        )}

       {messages.map((message, index) => (
  <Message key={index} message={message} />
))}

{
  loading && <div className='loader flex items-center gap-1.5'>
      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
    </div>
}


      </div>

{
  mode === 'image' && (
    <label className="inline-flex items-center gap-2 mb-3 text-sm mx-auto max-w-4xl w-full justify-center px-2">
      <p className="text-xs">Published Generated Image to Community</p>
      <input type="checkbox" className="cursor-pointer" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
    </label>
  )
}
      <form onSubmit={onSubmit} className="bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-4xl p-3 pl-4 mx-auto flex gap-3 sm:gap-4 items-center min-w-0" > 
        <select onChange={(e) =>setMode(e.target.value)} value={mode} className="text-sm pl-1 sm:pl-3 pr-1 sm:pr-2 outline-none shrink-0">
          <option className="dark:bg-purple-900" value="text">Text</option>
          <option className="dark:bg-purple-900" value="image">Image</option>
        </select>
        <input onChange={(e) => setPrompt(e.target.value)} value={prompt} type="text" placeholder="Type Your prompt  here..."  className="flex-1 min-w-0 text-sm outline-none" required/>
        <button disabled={loading} className="shrink-0">
          <img  src={loading ? assets.stop_icon : assets.send_icon} className="w-8 cursor-pointer" alt=""/>
        </button>
      </form>
    </div> 
  )
}

export default ChatBox;




