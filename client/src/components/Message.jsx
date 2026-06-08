import { assets } from '../assets/assets';
import moment from 'moment';
import Markdown from 'react-markdown';
import { useEffect } from 'react';
import Prism from 'prismjs';

const Message = ({message}) =>{
  useEffect(()=>{
    Prism.highlightAll()
  }, [message.content])

  const role = message.role?.toLowerCase();
  
  return(
    <div className="w-full min-w-0">
      {role === 'user'? (
        <div className="flex items-start justify-end my-4 gap-2 min-w-0">
            <div className="flex min-w-0 max-w-[min(82%,52rem)] flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md break-words [overflow-wrap:anywhere]">
              <p className="text-sm dark:text-primary break-words [overflow-wrap:anywhere]">{message.content}</p>
              <span className="text-xs text-gray-400 dark:text-[#B1A6C0]"> 
                {moment(message.timestamp).fromNow()}
              </span>
            </div>
            <img src={assets.user_icon}  alt="" className="w-8 shrink-0 rounded-full"/>
        </div>

      )
      :
      (
        <div className="inline-flex min-w-0 max-w-full sm:max-w-[min(92%,60rem)] flex-col gap-2 p-2 px-4 bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md my-4 break-words [overflow-wrap:anywhere]"> 
            {message.isImage ? (
              <img src={message.content} alt="" className="w-full max-w-md mt-2 rounded-md"/>
            ):
            (
              <div className="text-sm dark:text-primary reset-tw min-w-0 max-w-full break-words [overflow-wrap:anywhere]"><Markdown>{message.content}</Markdown></div>
            )}
            <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">{moment(message.timestamp).fromNow()}</span>
        </div>
      )
    }
    </div>
  )
}

export default Message;




