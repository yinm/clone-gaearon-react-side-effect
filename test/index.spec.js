const { expect } = require('chai')
const React = require('react')
const ExecutionEnvironment = require('exenv')
const jsdom = require('jsdom')
const { shallow, mount } = require('enzyme')
const { renderToStaticMarkup } = require('react-dom/server')
const { render } = require('react-dom')

const withSideEffect = require('../src')

function noop() { }
const identity = x => x

describe('react-side-effect', () => {
  describe('argument validation', () => {
    it('should throw if no reducePropsState function is provided', () => {
      expect(withSideEffect).to.throw('Expected reducePropsToState to be a function.')
    })

    it('should throw if no handleStateChangeOnClient function is provided', () => {
      expect(withSideEffect.bind(null, noop)).to.throw('Expected handleStateChangeOnClient to be a function.')
    })

    it('should throw if mapStateOnServer is defined but not a function', () => {
      expect(withSideEffect.bind(null, noop, noop, 'foo')).to.throw('Expected mapStateOnServer to either be undefined or a function.')
    })

    it('should throw if WrappedComponent is provided', () => {
      expect(withSideEffect(noop, noop)).to.throw('Expected WrappedComponent to be a React component')
    })
  })

  describe('displayName', () => {
    const withNoopSideEffect = withSideEffect(noop, noop)

    it('should wrap the displayName of wrapped createClass component', () => {
      const DummyComponent = React.createClass({displayName: 'Dummy', render: noop})
      const SideEffect = withNoopSideEffect(DummyComponent)

      expect(SideEffect.displayName).to.equal('SideEffect(Dummy)')
    })

    it('should wrap the displayName of wrapped ES2015 class component', () => {
      class DummyComponent extends React.Component {
        static displayName = 'Dummy'
        render() {}
      }
      const SideEffect = withNoopSideEffect(DummyComponent)

      expect(SideEffect.displayName).to.equal('SideEffect(Dummy)')
    })

    it('should use the constructor name of the wrapped functional component', () => {
      function DummyComponent() {}

      const SideEffect = withNoopSideEffect(DummyComponent)

      expect(SideEffect.displayName).to.equal('SideEffect(DummyComponent)')
    })

    it('should fallback to "Component', () => {
      const DummyComponent = React.createClass({displayName: null, render: noop})
      const SideEffect = withNoopSideEffect(DummyComponent)

      expect(SideEffect.displayName).to.equal('SideEffect(Component)')
    })
  })

  describe('SideEffect component', () => {
    class DummyComponent extends React.Component {
      render() {
        return <div>hello {this.props.foo}</div>
      }
    }

    const withIdentitySideEffect = withSideEffect(identity, noop)
    let SideEffect

    beforeEach(() => {
      SideEffect = withIdentitySideEffect(DummyComponent)
    })

    it('should expose the canUseDOM flag', () => {
      expect(SideEffect).to.have.property('canUseDOM', ExecutionEnvironment.canUseDOM)
    })

    describe('rewind', () => {
      it('should throw if used the browser', () => {
        SideEffect.canUseDOM = true
        expect(SideEffect.rewind).to.throw('You may only call rewind() on the server. Call peek() to read the current state.')
      })

      it('should return the current state', () => {
        shallow(<SideEffect foo="bar"/>)
        const state = SideEffect.rewind()
        expect(state).to.deep.equal([{foo: 'bar'}])
      })

      it('should reset the state', () => {
        shallow(<SideEffect foo="bar"/>)
        SideEffect.rewind()
        const state = SideEffect.rewind()
        expect(state).to.equal(undefined)
      })
    })

    describe('peek', () => {
      it('should return the current state', () => {
        shallow(<SideEffect foo="bar"/>)
        expect(SideEffect.peek()).to.deep.equal([{foo: 'bar'}])
      })

      it('should NOT reset the state', () => {
        shallow(<SideEffect foo="bar"/>)

        SideEffect.peek()
        const state = SideEffect.peek()

        expect(state).to.deep.equal([{foo: 'bar'}])
      })
    })

    describe('handleStateChangeOnClient', () => {
      it('should execute handleStateChangeOnClient', () => {
        let sideEffectCollectedData

        const handleStateChangeOnClient = state => (sideEffectCollectedData = state)

        SideEffect = withSideEffect(identity, handleStateChangeOnClient)(DummyComponent)

        SideEffect.canUseDOM = true

        shallow(<SideEffect foo="bar"/>)

        expect(sideEffectCollectedData).to.deep.equal([{foo: 'bar'}])
      })
    })

  })

})