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
        test('should get correct input value for node from graph', () => {
            const genome = getXorGenome()
            const graph = genome.getGraph()
            graph[0].value = 1
            graph[1].value = 0
            const client = new Client(genome)
            const a = client.getInputValue(graph[2].node, graph)
            const b = client.getInputValue(graph[3].node, graph)
            expect(a).toBe(20)
            expect(b).toBe(-20)
        })
    })
    describe('setRecurrentOutputCaches', () => {
        const extraRecurrentConnections = [
            [
                0, []
            ],
            [
                1, [new Connection(2, 0, Math.random(), 5, true)]
            ],
            [
                2, [new Connection(2, 0, Math.random(), 5, true), new Connection(4, 2, Math.random(), 6, true)]
            ]
        ]
        test.each(extraRecurrentConnections)('given %p extra recurrent connections should set outputCache correctly', (recurrentCount, cons) => {
            const genome = getXorGenome()
            for (let i = 0; i < cons.length; i++) {
                genome.connections.push(cons[i])
            }
            genome.buildGenomeMap()
            genome.constructLayers()
            const graph = genome.getGraph()
            for (let i = 0; i < genome.nodes.length; i++) {
                const node = genome.nodes[i]
                graph[node.id].value = 0.1 + Math.random()
            }
            const client = new Client(genome)
            for (let i = 0; i < genome.connections.length; i++) {
                const con = genome.connections[i]
                expect(con.outputCache).toBe(0)
            }
            client.setRecurrentOutputCaches(graph)
            let setOutputCacheCount = 0
            for (let i = 0; i < genome.connections.length; i++) {
                const con = genome.connections[i]
                if (con.outputCache != 0) setOutputCacheCount++
            }
            expect(setOutputCacheCount).toBe(recurrentCount)
        })
    })
    describe('getOutput', () => {
        test('should get output array from give graph', () => {
            const genome = getXorGenome()
            genome.nodes.push(new Node(5, NodeType.output, 10))
            genome.buildGenomeMap()
            genome.constructLayers()
            const client = new Client(genome)
            const graph = genome.getGraph()
            const outputNodeIds = client.genome.layers.slice(-1)[0].map(n => n.id)
            for (let i = 0; i < 100; i++) {
                const values = new Array(outputNodeIds.length).fill(0).map(v => Math.random())
                for (let j = 0; j < outputNodeIds.length; j++) {
                    const id = outputNodeIds[j]
                    graph[id].value = values[j]
                }
                const result = client.getOutput(graph)
                expect(result.length).toBe(values.length)
                for (let j = 0; j < result.length; j++) {
                    expect(result[j]).toBe(values[j])
                }
            }

        })
    })
    describe('feedForward', () => {
        test.each(xorTestData)('given %p should return %p', (inputs, expected) => {
            const client = new Client(getXorGenome())
            const graph = client.genome.getGraph()
            const result = client.feedForward(inputs, graph)
            expect(result.join(',')).toBe(expected.join(','))
        })
    })
    describe('predict', () => {
        test.each(xorTestData)('xorClient given %p should predict %p', (inputs, expected) => {
            const client = new Client(getXorGenome())
            const result = client.predict(inputs)
            expect(result.join(',')).toBe(expected.join(','))
        })
        const incorrectInputs = [
            [
                []
            ],
            [
                [1, 2, 3]
            ],
            [
                [9999]
            ]
        ]
        test.each(incorrectInputs)('should throw error given incorrect input amount', (inputs) => {
            const client = new Client(getXorGenome())
            try {
                client.predict(inputs)
            } catch (err) {
                expect(err).toBe(`Expected input size 2 but received ${inputs.length}`)
            }
        })
    })
})