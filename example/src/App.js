import React, { useState } from 'react'

import { LiveStateProvider, useLiveState, uuid } from 'livestate'
import LandingPage from './landing'
import 'livestate/dist/index.css'

const App = () => {
  return (
    <LiveStateProvider uri='wss://try.livestate.io/socket'>
      <CounterButton />
      <Counter />
      <Chat />
      <LandingPage />
    </LiveStateProvider>
  )
}

const counterConfig = {
  id: uuid('counter'),
  defaultValue: 0
}

const CounterButton = () => {
  const [state, setCounter] = useLiveState(counterConfig)
  return <button onClick={() => setCounter(state + 1)}>Inc {state}</button>
}

const Counter = () => {
  const [state] = useLiveState(counterConfig)
  return <p>{state}</p>
}

const chatConfig = {
  id: uuid('chat'),
  defaultValue: {
    participants: [],
    messages: []
  }
}

const Chat = () => {
  const [state, setState] = useLiveState(chatConfig)
  const [inputValue, setValue] = useState('')

  return (
    <div>
      <ul>
        {state.messages.map((message) => (
          <li>{message.text}</li>
        ))}
      </ul>
      <input value={inputValue} onChange={(e) => setValue(e.target.value)} />
      <button
        onClick={() => {
          setState({
            ...state,
            messages: [...state.messages, { text: inputValue }]
          })

          setValue('')
        }}
      >
        Send
      </button>
    </div>
  )
}

export default App
