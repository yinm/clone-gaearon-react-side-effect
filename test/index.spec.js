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

})