const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const TestHelper = require('../test-helper')
const Payment = require('./payment')
const wreck = require('@hapi/wreck')
const paymentsUrl = 'http://fake-payments.com'
const returnUrl = 'http://fake-return.com'

lab.experiment(TestHelper.getFile(__filename), () => {
  let sandbox
  let requestArgs
  let requestMethod
  let expectedResult

  lab.beforeEach(() => {
    requestMethod = async (...args) => { requestArgs = args }

    expectedResult = {
      state: {
        status: 'created'
      },
      _links: {
        next_url: {
          href: returnUrl
        }
      }
    }

    // Stub methods
    sandbox = sinon.createSandbox()
    TestHelper.stubCommon(sandbox)
    sandbox.stub(wreck, 'request').value(async (...args) => requestMethod(...args))
  })

  lab.afterEach(async () => {
    // Restore the sandbox to make sure the stubs are removed correctly
    sandbox.restore()
  })

  lab.experiment('requestPayment', () => {
    const config = {
      paymentsUrl,
      apiKey: 'api-key',
      amount: 10,
      reference: 'ref',
      description: 'description',
      returnUrl
    }

    lab.beforeEach(() => {
      sandbox.stub(wreck, 'read').value(async () => expectedResult)
    })

    lab.test('when payment is successful', async () => {
      const payment = new Payment(config)
      const result = await payment.requestPayment()
      Code.expect(result).to.equal(expectedResult)

      // Now check request was called with the correct arguments
      const [method, url] = requestArgs
      Code.expect(method).to.equal('POST')
      Code.expect(url).to.endWith(config.paymentsUrl)
    })

    lab.test('when payment is unsuccessful', async () => {
      expectedResult = { code: 101, description: 'failure' }
      const payment = new Payment(config)
      const result = await payment.requestPayment()
      Code.expect(result.message).to.equal('101: failure')
    })

    lab.test('when request throws an error', async () => {
      // Override stubbed request method
      const testError = new Error('test error')
      requestMethod = () => {
        throw testError
      }

      const payment = new Payment(config)
      let error
      try {
        await payment.requestPayment()
      } catch (err) {
        error = err
      }
      Code.expect(error).to.equal(testError)
    })
  })
})