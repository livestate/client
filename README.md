# livestate

> livestate.io client

[![NPM](https://img.shields.io/npm/v/livestate.svg)](https://www.npmjs.com/package/livestate) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save livestate
```

## Usage

```jsx
import { useLiveState, LiveStateProvider } from 'livestate'

const App = () => (
  <LiveStateProvider uri='wss://try.livestate.io/socket'>
    <CounterExample />
  </LiveStateProvider>
)

const counterId = 'the-universal-global-counter-id'
const CounterExample = () => {
  const [state, setState] = useLiveState({
    id: counterId,
    defaultValue: { counter: 0 }
  })

  return (
    <div>
      <button onClick={() => setState({ counter: state.counter + 1 })}>
        Increment
      </button>
      <p>Counter: {state.counter}</p>
    </div>
  )
}
```

## License

MIT © [webdeb](https://github.com/webdeb)
