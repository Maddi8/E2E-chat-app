import React from 'react'

const Message = ({ username, message, timestamp }) => {
  const time = new Date(timestamp).toLocaleString();
  return (
    <li className='flex flex-col justify-center my-2 p-1'>
        <p className='font-bold'>{username}</p>
        <p>{message}</p>
        <p>{time}</p>
        <p>fingerprint</p>
    </li>
  )
}

export default Message