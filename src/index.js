import React, { useEffect, useState, createContext, useContext } from 'react'
import { Socket } from 'phoenix'
import * as jsonpatch from 'fast-json-patch'

const liveStateValue = {
  socket: null,
  socketStatus: null,
  channels: {},
  channelsState: {}
}

const LiveStateContext = createContext(liveStateValue)
export const SocketConnector = ({ uri }) => {
  const liveState = useContext(LiveStateContext)
  const setSocket = (socket) => {
    liveState.set((liveState) => ({ ...liveState, socket }))
  }
  const setSocketStatus = (socketStatus) => {
    liveState.set((liveState) => ({ ...liveState, socketStatus }))
  }

  useEffect(() => {
    const socket = new Socket(uri || 'ws://localhost:4000/socket')
    socket.connect()
    socket.onOpen(() => setSocketStatus('open'))
    socket.onClose(() => setSocketStatus('closed'))

    setSocket(socket)

    return () => {
      socket.disconnect()
      setSocket(null)
    }
  }, [])

  return null
}

export const LiveStateProvider = ({ children, uri }) => {
  const [value, set] = useState(liveStateValue)

  return (
    <LiveStateContext.Provider value={{ ...value, set }}>
      {children}
      <SocketConnector uri={uri} />
    </LiveStateContext.Provider>
  )
}

export const useLiveState = ({ id, defaultValue }) => {
  const { socket, channels = {}, channelsState = {}, set } = useContext(
    LiveStateContext
  )
  const setChannels = (fn) => {
    set((liveState) => ({ ...liveState, channels: fn(liveState.channels) }))
  }
  const setChannelsState = (fn) => {
    set((liveState) => ({
      ...liveState,
      channelsState: fn(liveState.channelsState)
    }))
  }

  const channel = channels[id]
  const state = channelsState[id]

  const setState = (newStateOrFunction) => {
    setChannelsState((channelsState) => {
      const newState =
        typeof newStateOrFunction === 'function'
          ? newStateOrFunction(channelsState[id])
          : { ...channelsState[id], ...newStateOrFunction }

      const patch = jsonpatch.compare(channelsState[id] || {}, newState)
      if (channel) {
        channel.push('patch', { patch })
      }

      return { ...channelsState, [id]: newState }
    })
  }

  useEffect(() => {
    if (state === undefined) {
      setState(defaultValue)
    }

    if (!channel && socket) {
      const channel = socket.channel('state:' + id, defaultValue)

      channel
        .join()
        .receive('ok', (response) => console.log('ok', response))
        .receive('error', (response) => console.log('error', response))
        .receive('timeout', (response) => console.log('timeout', response))

      channel.on('patch', ({ patch: patches }) => {
        setChannelsState((channelsState) => ({
          ...channelsState,
          [id]: jsonpatch.applyPatch(channelsState[id], patches).newDocument
        }))
      })

      channel.on('replace', (newState) => {
        setChannelsState((channelsState) => ({
          ...channelsState,
          [id]: newState
        }))
      })

      setChannels((channels) => ({ ...channels, [id]: channel }))
    }
  }, [state, channel, socket])

  return [state || defaultValue, setState]
}

// https://gist.github.com/jed/982883#gistcomment-3644691
export const uuid = (name) => {
  if (name) return getStoredUuid(name)

  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      ((window.crypto || window.msCrypto).getRandomValues(
        new Uint8Array(1)
      )[0] &
        (15 >> (c / 4)))
    ).toString(16)
  )
}

const prefix = 'LIVESTATE_UUID_'
const getStoredUuid = (name) => {
  if (typeof name !== 'string') throw Error('Name of id must be a string')

  const storageKey = prefix + name
  let id = localStorage.getItem(storageKey)
  if (!id) {
    id = uuid()
    localStorage.setItem(storageKey, id)
  }

  return id
}
