const Client = require('./client')
const Genome = require('./neatGenome')
const Node = require('./neatNode')
const Connection = require('./neatConnection')
const Neat = require('../neat')
const NodeType = require('./nodeType')

describe('client', () => {
    const xorTestData = [
        [
            [0, 0],
            [0.000045439104876545914]
        ],
        [
            [0, 1],
            [0.999954519621495]
        ],
        [
            [1, 0],
            [0.999954519621495]
        ],
        [
            [1, 1],
            [0.000045439104876545914]
        ],
    ]
    const getXorGenome = () => {
        const nodes = []
        nodes.push(new Node(0, NodeType.input, 0))
        nodes.push(new Node(1, NodeType.input, 0))
        nodes.push(new Node(2, NodeType.hidden, -10))
        nodes.push(new Node(3, NodeType.hidden, 30))
        nodes.push(new Node(4, NodeType.output, -30))
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].activation = 1
        }
        const connections = []
        connections.push(new Connection(nodes[0].id, nodes[2].id, 20, 0))
        connections.push(new Connection(nodes[0].id, nodes[3].id, -20, 1))

        connections.push(new Connection(nodes[1].id, nodes[2].id, 20, 2))
        connections.push(new Connection(nodes[1].id, nodes[3].id, -20, 3))

        connections.push(new Connection(nodes[2].id, nodes[4].id, 20, 4))
        connections.push(new Connection(nodes[3].id, nodes[4].id, 20, 5))

        return new Genome(nodes, connections)
    }
    describe('ctor', () => {
        test('should return client with default score genomeCost & passed genome', () => {
            const genome = getXorGenome()
            const client = new Client(genome)
            expect(client.score).toBe(-Infinity)
            expect(client.genomeCost).toBe(0)
        })
    })
    describe('getInputValue', () => {
        // TODO: add tests
    })
    describe('setRecurrentOutputCaches', () => {
        // TODO: add tests
    })
    describe('getOutput', () => {
        // TODO: add tests
    })
    describe('feedForward', () => {
        // TODO: add tests
    })
    describe('predict', () => {
        test.each(xorTestData)('xorClient given %p should predict $p', (inputArr, expected) => {
            const client = new Client(getXorGenome())
            const result = client.predict(inputArr)
            expect(result.join(',')).toBe(expected.join(','))
        })
    })
})