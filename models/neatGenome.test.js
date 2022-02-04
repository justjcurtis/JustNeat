const Genome = require('./neatGenome')
const Node = require('./neatNode')
const Connection = require('./neatConnection')
const Client = require('./client')
const Neat = require('../neat')
const NodeType = require('./nodeType')
const { aNm } = require('../helpers/activationHelper')

describe('neatGenome', () => {
    const getNodes = () => [
        new Node(0, NodeType.input, 0),
        new Node(1, NodeType.input, 0),
        new Node(3, NodeType.hidden, -10),
        new Node(4, NodeType.hidden, 30),
        new Node(2, NodeType.output, -30),
    ]
    const getConnections = () => [
        new Connection(0, 3, 20, 0),
        new Connection(0, 4, -20, 1),
        new Connection(1, 3, 20, 2),
        new Connection(1, 4, -20, 3),
        new Connection(3, 2, 20, 4),
        new Connection(4, 2, 20, 5),
    ]
    const getLayers = (nodes) => [
        [nodes[0], nodes[1]],
        [nodes[2], nodes[3]],
        [nodes[4]]
    ]
    const getXorGenome = () => new Genome(getNodes(), getConnections())
    const getRecurrentGenome = () => {
        const genome = getXorGenome()
        genome.connections.push(new Connection(2, 3, 24, 6, true))
        return genome
    }
    const getRealNeat = (genome) => {
        const inputCount = genome.nodes.filter(n => n.type == NodeType.input).length
        const outputCount = genome.nodes.filter(n => n.type == NodeType.output).length
        const neat = new Neat(inputCount, outputCount)
        neat.pop = [new Client(genome)]
        neat.connectionPool = {}
        neat.currentConnections = 0
        neat.nodePool = []
        neat.mandatoryNodes = []
        for (let i = 0; i < genome.nodes.length; i++) {
            neat.nodePool.push(genome.nodes[i].copy())
            neat.mandatoryNodes.push(genome.nodes[i].copy())
        }
        for (let i = 0; i < genome.connections.length; i++) {
            neat.connectionPool[genome.connections[i].id] = genome.connections[i].innov
            neat.currentConnections++
        }
        return neat
    }
    const recurrentNonRecurrentTestData = [
        ['non-recurrent', false],
        ['recurrent', true]
    ]
    describe('ctor', () => {
        test.each(recurrentNonRecurrentTestData)('given nodes and connections (%p) should get a genome with maps & layers built', (_, recurrent) => {
            const nodes = getNodes()
            const connections = getConnections()
            if (recurrent)
                connections.push(new Connection(2, 3, 24, 6, true))
            const layers = getLayers(nodes)
            const genome = new Genome(nodes, connections)
            expect(genome.nodes.length).toBe(nodes.length)
            for (let i = 0; i < genome.nodes.length; i++) {
                expect(genome.nodes[i]).toBe(nodes[i])
                expect(genome.nodeMap[nodes[i].id]).toBe(i)
            }
            expect(genome.connections.length).toBe(connections.length)
            for (let i = 0; i < genome.connections.length; i++) {
                expect(genome.connections[i]).toBe(connections[i])
                expect(genome.connectionMap[connections[i].id]).toBe(i)
            }
            for (let i = 0; i < genome.layers.length; i++) {
                const layer = genome.layers[i]
                for (let j = 0; j < layer.length; j++) {
                    expect(layer[j].toJson()).toBe(layers[i][j].toJson())
                }
            }
        })
    })
    describe('buildGenomeMap', () => {
        test.each(recurrentNonRecurrentTestData)('buildGenomeMap (%p) should set nodeMap & connectionMap as expected', (_, recurrent) => {
            const genome = recurrent ? getRecurrentGenome() : getXorGenome()
            genome.connectionMap = {}
            genome.nodeMap = {}
            genome.buildGenomeMap()
            for (let i = 0; i < genome.nodes.length; i++) {
                expect(genome.nodeMap[genome.nodes[i].id]).toBe(i)
            }
            for (let i = 0; i < genome.connections.length; i++) {
                expect(genome.connectionMap[genome.connections[i].id]).toBe(i)
            }
        })
    })
    describe('getGraph', () => {
        test.each(recurrentNonRecurrentTestData)('should return expected graph for %p genome', (_, recurrent) => {
            const genome = recurrent ? getRecurrentGenome() : getXorGenome()
            const graph = genome.getGraph()

            const checkGraph = {}
            for (let i = 0; i < genome.nodes.length; i++) {
                let node = genome.nodes[i]
                checkGraph[node.id] = { children: [], parents: [], value: 0, node }
            }
            for (let i = 0; i < genome.connections.length; i++) {
                const con = genome.connections[i]
                checkGraph[con.inNode].children.push(con)
                checkGraph[con.outNode].parents.push(con)
            }

            for (let i = 0; i < genome.nodes.length; i++) {
                const id = genome.nodes[i].id
                const { parents, children, value, node } = graph[id]
                expect(node).toBe(genome.nodes[i])
                expect(value).toBe(0)
                expect(parents.length).toBe(checkGraph[id].parents.length)
                for (let j = 0; j < parents.length; j++) {
                    let found = 0
                    for (let c = 0; c < checkGraph[id].parents.length; c++) {
                        if (parents[j].id == checkGraph[id].parents[c].id) found++
                    }
                    expect(found).toBe(1)
                }
                expect(children.length).toBe(checkGraph[id].children.length)
                for (let j = 0; j < children.length; j++) {
                    let found = 0
                    for (let c = 0; c < checkGraph[id].children.length; c++) {
                        if (children[j].id == checkGraph[id].children[c].id) found++
                    }
                    expect(found).toBe(1)
                }
            }
        })
    })
    describe("getLongestPathToInput", () => {
        const getLongestPathToInputInterposeTestData = [
            [
                [
                    [0, 4, 5]
                ], 4, 1, 2
            ],
            [
                [
                    [0, 4, 5],
                    [5, 4, 6],
                ], 4, 1, 3
            ],
        ]
        test.each(getLongestPathToInputInterposeTestData)('getLongestPathToInput should return expected value following interpose', (interposes, nodeId, pre, post) => {
            const genome = getXorGenome()
            let graph = genome.getGraph()
            const preCheck = genome.getLongestPathToInput(nodeId, graph)
            let maxInnov = 5
            expect(preCheck).toBe(pre)
            for (let i = 0; i < interposes.length; i++) {
                const inNode = genome.nodes[genome.nodeMap[interposes[i][0]]]
                const outNode = genome.nodes[genome.nodeMap[interposes[i][1]]]
                const newNodeId = interposes[i][2]
                const node = new Node(newNodeId, NodeType.hidden, Math.random())
                const con = genome.connections[genome.connectionMap[`${inNode.id},${outNode.id}`]]
                con.enabled = false
                const a = new Connection(inNode.id, newNodeId, Math.random(), maxInnov + 1)
                const b = new Connection(newNodeId, outNode.id, Math.random(), maxInnov + 1)
                genome.connections.push(a)
                genome.connections.push(b)
                genome.nodes.push(node)
                genome.buildGenomeMap()
            }
            graph = genome.getGraph()
            const postCheck = genome.getLongestPathToInput(nodeId, graph)
            expect(postCheck).toBe(post)
        })
        it('adding shorter connection to input from a node doesn\'t change the longest path', () => {
            const genome = getXorGenome()
            let graph = genome.getGraph()
            const pre = genome.getLongestPathToInput(2, graph)
            genome.connections.push(new Connection(0, 2, Math.random(), 6))
            genome.buildGenomeMap()
            graph = genome.getGraph()
            const post = genome.getLongestPathToInput(2, graph)
            expect(pre).toBe(post)
        })
        it('adding longer recurrent connection to input from a node doesn\'t change the longest path', () => {
            const genome = getXorGenome()
            let graph = genome.getGraph()
            const pre = genome.getLongestPathToInput(2, graph)
            genome.connections.push(new Connection(2, 7, Math.random(), 6))
            genome.connections.push(new Connection(7, 6, Math.random(), 6))
            genome.connections.push(new Connection(6, 0, Math.random(), 6))
            genome.nodes.push(new Node(6, NodeType.hidden, Math.random()))
            genome.nodes.push(new Node(7, NodeType.hidden, Math.random()))
            genome.nodes.push(new Node(8, NodeType.hidden, Math.random()))
            genome.buildGenomeMap()
            graph = genome.getGraph()
            const post = genome.getLongestPathToInput(2, graph)
            expect(pre).toBe(post)
        })
    })
    describe("constructLayers", () => {
        it('should construct layers as expected', () => {
            const genome = getXorGenome()
            const layers = getLayers(genome.nodes)
            genome.layers = []
            genome.constructLayers()
            for (let i = 0; i < genome.layers.length; i++) {
                const layer = genome.layers[i]
                for (let j = 0; j < layer.length; j++) {
                    expect(layer[j].toJson()).toBe(layers[i][j].toJson())
                }
            }
        })
        it('should set recurrent connections correctly', () => {
            const genome = getXorGenome()
            genome.layers = []
            for (let i = 0; i < genome.connections.length; i++) {
                genome.connections[i].recurrent = !genome.connections[i].recurrent
            }
            genome.constructLayers()
            for (let i = 0; i < genome.connections.length; i++) {
                const con = genome.connections[i]
                const inNode = genome.nodes[genome.nodeMap[con.inNode]]
                const outNode = genome.nodes[genome.nodeMap[con.outNode]]
                const isRecurrent = inNode.layer > outNode.layer
                expect(con.recurrent).toBe(isRecurrent)
            }
        })

        it('should disable connections on same layer', () => {
            const genome = getXorGenome()
            genome.connections.push(new Connection(3, 4, 10, 7, false, true))
            genome.layers = []
            for (let i = 0; i < genome.connections.length; i++) {
                genome.connections[i].recurrent = !genome.connections[i].recurrent
            }
            genome.constructLayers()
            for (let i = 0; i < genome.connections.length; i++) {
                const con = genome.connections[i]
                const inNode = genome.nodes[genome.nodeMap[con.inNode]]
                const outNode = genome.nodes[genome.nodeMap[con.outNode]]
                if (inNode.layer == outNode.layer) expect(con.enabled == false)
            }
        })
    })
    describe("simplifications", () => {
        let randomVal = 0.5
        const random = Math.random
        afterEach(() => {
            global.Math.random = random
        })
        const getMockMutationGenome = () => {
            const genome = getXorGenome()
            genome.mutateActivation = jest.fn()
            genome.mutateBiasRandom = jest.fn()
            genome.mutateBiasShift = jest.fn()
            genome.mutateConnection = jest.fn()
            genome.mutateDeleteConnection = jest.fn()
            genome.mutateDeleteNode = jest.fn()
            genome.mutateDisableConnection = jest.fn()
            genome.mutateInterpose = jest.fn()
            genome.mutateWeightRandom = jest.fn()
            genome.mutateWeightShift = jest.fn()
            genome.mutate = jest.fn()
            return genome
        }
        const getNeat = () => ({
            probs: {
                weightMutationChance: 0,
                weightShiftChance: 0,
                biasMutationChance: 0,
                biasShiftChance: 0,
                addConnectionChance: 0,
                addRecurrentChance: 0,
                reEnableConnectionChance: 0,
                disableConnectionChance: 0,
                addNodeChance: 0,
                deleteConnectionChance: 0,
                deleteNodeChance: 0,
                randomActivationChance: 0,
            }
        })
        describe('simplify', () => {
            it('should call mutateDeleteConnection when Math.random() < disableConnectionChance', () => {
                global.Math.random = () => randomVal
                const genome = getMockMutationGenome()
                const neat = getNeat(genome)
                genome.simplify(neat)
                expect(genome.mutateDeleteConnection.mock.calls.length).toBe(0)
                expect(genome.mutateDeleteNode.mock.calls.length).toBe(0)
                expect(genome.mutate.mock.calls.length).toBe(1)
                neat.probs.deleteConnectionChance = 1
                genome.simplify(neat)
                expect(genome.mutateDeleteConnection.mock.calls.length).toBe(1)
                expect(genome.mutateDeleteNode.mock.calls.length).toBe(0)
                expect(genome.mutate.mock.calls.length).toBe(2)
            })

            it('should call mutateDeleteNode when Math.random() < addNodeChance', () => {
                global.Math.random = () => randomVal
                const neat = getNeat()
                const genome = getMockMutationGenome()
                genome.simplify(neat)
                expect(genome.mutateDeleteNode.mock.calls.length).toBe(0)
                expect(genome.mutateDeleteConnection.mock.calls.length).toBe(0)
                expect(genome.mutate.mock.calls.length).toBe(1)
                neat.probs.addNodeChance = 1
                genome.simplify(neat)
                expect(genome.mutateDeleteNode.mock.calls.length).toBe(1)
                expect(genome.mutateDeleteConnection.mock.calls.length).toBe(0)
                expect(genome.mutate.mock.calls.length).toBe(2)
            })
        })

        describe('deleteConnection', () => {
            it('should delete the connection with the same id & rebuild maps', () => {
                const genome = getXorGenome()
                const conId = genome.connections[4].id
                genome.deleteConnection(conId)
                let found = false
                for (let i = 0; i < genome.connections; i++) {
                    if (genome.connections[i].id == conId) {
                        found = true
                        break
                    }
                }
                expect(found).toBe(false)
                expect(genome.connectionMap[conId]).toBe(undefined)
            })
        })

        describe('deleteNode', () => {
            it('should delete the node with the same id & rebuild maps', () => {
                const genome = getXorGenome()
                const nodeId = genome.nodes[4].id
                genome.deleteNode(nodeId)
                let found = false
                for (let i = 0; i < genome.nodes; i++) {
                    if (genome.nodes[i].id == nodeId) {
                        found = true
                        break
                    }
                }
                expect(found).toBe(false)
                expect(genome.nodeMap[nodeId]).toBe(undefined)
            })
        })

        describe('mutateDeleteConnection', () => {
            it('mutateDeleteConnection should delete the connection and hidden nodes with no other connections on the same side', () => {
                const genome = getXorGenome()
                let i = 0
                let limit = genome.connections.length
                while (genome.connections.length > 0) {
                    if (i >= limit) break
                    const preIds = Object.keys(genome.connectionMap)
                    genome.mutateDeleteConnection()
                    const postIds = Object.keys(genome.connectionMap)
                    expect(preIds.length > postIds.length).toBe(true)
                    i++
                }
                expect(genome.connections.length).toBe(0)
                expect(genome.nodes.length).toBe(3)
                expect(genome.nodes.filter(n => n.type != Node.hidden).length).toBe(genome.nodes.length)

            })
        })
        describe('mutateDeleteNode', () => {
            const mutateDeleteNodeTestData = [
                [getXorGenome()],
                [(function() {
                    const genome = getXorGenome()
                    genome.deleteConnection('1,3')
                    genome.deleteConnection('1,4')
                    genome.nodes.push(new Node(5, NodeType.output, 10))
                    genome.connections.push(new Connection(3, 5, Math.random(), 5))
                    genome.connections.push(new Connection(4, 5, Math.random(), 6))
                    genome.buildGenomeMap()
                    genome.constructLayers()
                    return genome
                }())]
            ]
            test.each(mutateDeleteNodeTestData)('mutateDeleteNode should delete a hidden node with either only 1 input or output replace the connections with 1', (genome) => {
                const neat = getRealNeat(genome)
                const preNotHidden = genome.nodes.filter(n => n.type != NodeType.hidden).length
                const preHidden = genome.nodes.filter(n => n.type == NodeType.hidden)
                const postConnectionIds = {}
                const graph = genome.getGraph()
                for (let i = 0; i < preHidden.length; i++) {
                    const cons = {...genome.connectionMap }
                    const parents = graph[preHidden[i].id].parents
                    const children = graph[preHidden[i].id].children
                    if (parents.length == 1) {
                        for (let j = 0; j < children.length; j++) {
                            cons[`${parents[0].inNode},${children[j].outNode}`] = -1
                            delete cons[children[j].id]
                        }
                        delete cons[parents[0].id]
                    }
                    if (children.length == 1) {
                        for (let j = 0; j < parents.length; j++) {
                            cons[`${parents[j].inNode},${children[0].outNode}`] = -1
                            delete cons[parents[j].id]
                        }
                        delete cons[children[0].id]
                    }
                    postConnectionIds[preHidden[i].id] = cons
                }
                const preNodes = Object.keys(genome.nodeMap).length
                const preConnections = Object.keys(genome.connectionMap).length
                genome.mutateDeleteNode(neat)
                const postNotHidden = genome.nodes.filter(n => n.type != NodeType.hidden).length
                const postHidden = genome.nodes.filter(n => n.type == NodeType.hidden)
                const postNodes = Object.keys(genome.nodeMap).length
                const postConnections = Object.keys(genome.connectionMap).length
                expect(preNodes > postNodes).toBe(true)
                expect(preConnections > postConnections).toBe(true)
                expect(preNotHidden).toBe(postNotHidden)
                const missingNodeId = preHidden.filter(n => !postHidden.includes(n))[0].id
                expect(Object.keys(genome.connectionMap).join(' ')).toBe(Object.keys(postConnectionIds[missingNodeId]).join(' '))
            })
        })
    })
    describe("augmentations", () => {
        let randomVal = 0.5
        const random = Math.random
        afterEach(() => {
            global.Math.random = random
        })
        const getMockMutationGenome = () => {
            const genome = getXorGenome()
            genome.mutateActivation = jest.fn()
            genome.mutateBiasRandom = jest.fn()
            genome.mutateBiasShift = jest.fn()
            genome.mutateConnection = jest.fn()
            genome.mutateDeleteConnection = jest.fn()
            genome.mutateDeleteNode = jest.fn()
            genome.mutateDisableConnection = jest.fn()
            genome.mutateInterpose = jest.fn()
            genome.mutateWeightRandom = jest.fn()
            genome.mutateWeightShift = jest.fn()
            genome.mutate = jest.fn()
            return genome
        }
        const getNeat = () => ({
            probs: {
                weightMutationChance: 0,
                weightShiftChance: 0,
                biasMutationChance: 0,
                biasShiftChance: 0,
                addConnectionChance: 0,
                addRecurrentChance: 0,
                reEnableConnectionChance: 0,
                disableConnectionChance: 0,
                addNodeChance: 0,
                deleteConnectionChance: 0,
                deleteNodeChance: 0,
                randomActivationChance: 0,
            }
        })
        describe('augment', () => {
            it('should call mutateConnection when Math.random() < neat.probs.addConnectionChance', () => {
                global.Math.random = () => randomVal
                const genome = getMockMutationGenome()
                const neat = getNeat(genome)
                genome.augment(neat)
                expect(genome.mutateConnection.mock.calls.length).toBe(0)
                expect(genome.mutateInterpose.mock.calls.length).toBe(0)
                expect(genome.mutateDisableConnection.mock.calls.length).toBe(0)
                expect(genome.mutate.mock.calls.length).toBe(1)
                neat.probs.addConnectionChance = 1
                genome.augment(neat)
                expect(genome.mutateConnection.mock.calls.length).toBe(1)
                expect(genome.mutateInterpose.mock.calls.length).toBe(0)
                expect(genome.mutateDisableConnection.mock.calls.length).toBe(0)
                expect(genome.mutate.mock.calls.length).toBe(2)
            })
            it('should call mutateInterpose when Math.random() < neat.probs.addNodeChance', () => {
                global.Math.random = () => randomVal
                const genome = getMockMutationGenome()
                const neat = getNeat(genome)
                genome.augment(neat)
                expect(genome.mutateConnection.mock.calls.length).toBe(0)
                expect(genome.mutateInterpose.mock.calls.length).toBe(0)
                expect(genome.mutateDisableConnection.mock.calls.length).toBe(0)
                expect(genome.mutate.mock.calls.length).toBe(1)
                neat.probs.addNodeChance = 1
                genome.augment(neat)
                expect(genome.mutateConnection.mock.calls.length).toBe(0)
                expect(genome.mutateInterpose.mock.calls.length).toBe(1)
                expect(genome.mutateDisableConnection.mock.calls.length).toBe(0)
                expect(genome.mutate.mock.calls.length).toBe(2)
            })
            it('should call mutateDisableConnection when Math.random() < neat.probs.disableConnectionChance', () => {
                global.Math.random = () => randomVal
                const genome = getMockMutationGenome()
                const neat = getNeat(genome)
                genome.augment(neat)
                expect(genome.mutateConnection.mock.calls.length).toBe(0)
                expect(genome.mutateInterpose.mock.calls.length).toBe(0)
                expect(genome.mutateDisableConnection.mock.calls.length).toBe(0)
                expect(genome.mutate.mock.calls.length).toBe(1)
                neat.probs.disableConnectionChance = 1
                genome.augment(neat)
                expect(genome.mutateConnection.mock.calls.length).toBe(0)
                expect(genome.mutateInterpose.mock.calls.length).toBe(0)
                expect(genome.mutateDisableConnection.mock.calls.length).toBe(1)
                expect(genome.mutate.mock.calls.length).toBe(2)
            })
        })
        describe('mutateConnection', () => {
            const mutateConnectionTestData = [
                ['recurrent', 1],
                ['non-recurrent', 0]
            ]
            test.each(mutateConnectionTestData)('should add a valid connection between 2 nodes (%p)', (_, recurrentChance) => {
                const genome = getXorGenome()
                genome.deleteConnection('0,4')
                genome.deleteConnection('1,3')
                const startingConnectionCount = genome.connections.length
                genome.buildGenomeMap()
                genome.constructLayers()
                const neat = getRealNeat(genome)
                neat.probs.addRecurrentChance = recurrentChance
                for (let i = 0; i < 100; i++) {
                    genome.mutateConnection(neat)
                }
                expect(genome.connections.length > startingConnectionCount).toBe(true)
                expect(genome.layers.length).toBe(3)
                const seenConnections = {}
                let hasRecurrent = false
                for (let i = 0; i < genome.connections.length; i++) {
                    const con = genome.connections[i]
                    expect(genome.connectionMap[con.id]).toBe(i)
                    expect(seenConnections[con.id]).toBe(undefined)
                    seenConnections[con.id] = true
                    const inNode = genome.nodes[genome.nodeMap[con.inNode]]
                    const outNode = genome.nodes[genome.nodeMap[con.outNode]]
                    expect(inNode == undefined).toBe(false)
                    expect(outNode == undefined).toBe(false)
                    expect(inNode.layer == outNode.layer).toBe(false)
                    if (con.recurrent) hasRecurrent = true
                }
                expect(hasRecurrent).toBe(recurrentChance == 1)
            })
        })
        describe('mutateInterpose', () => {
            it('should add a node along a connection and update genome correctly', () => {
                const genome = getXorGenome()
                const neat = getRealNeat(genome)
                for (let i = 0; i < 10; i++) {
                    const preNodeCount = genome.nodes.length
                    const preConnectionCount = genome.connections.length
                    genome.mutateInterpose(neat)
                    const postNodeCount = genome.nodes.length
                    const postConnectionCount = genome.connections.length
                    expect(preNodeCount + 1).toBe(postNodeCount)
                    expect(preConnectionCount + 2).toBe(postConnectionCount)
                    for (let i = 0; i < genome.connections.length; i++) {
                        const con = genome.connections[i]
                        const inNode = genome.nodes[genome.nodeMap[con.inNode]]
                        const outNode = genome.nodes[genome.nodeMap[con.outNode]]
                        if (inNode.layer == outNode.layer) expect(con.enabled).toBe(false)
                        if (inNode.layer > outNode.layer) expect(con.recurrent).toBe(true)
                        if (inNode.layer > outNode.layer) expect(con.enabled).toBe(false)
                    }
                }
            })
        })
        describe('mutateDisableConnection', () => {
            it('should disable random connection', () => {
                const genome = getXorGenome()
                for (let i = 0; i < genome.connections.length; i++) {
                    const preDisabled = genome.connections.filter(c => !c.enabled).length
                    genome.mutateDisableConnection()
                    const postDisabled = genome.connections.filter(c => !c.enabled).length
                    expect(preDisabled + 1).toBe(postDisabled)
                }
                const enabledConnectionsCount = genome.connections.filter(c => c.enabled).length
                expect(enabledConnectionsCount).toBe(0)
            })
        })
    })
    describe("mutations", () => {
        let randomVal = 0.5
        const random = Math.random
        afterEach(() => {
            global.Math.random = random
        })
        const getMockMutationGenome = () => {
            const genome = getXorGenome()
            genome.mutateActivation = jest.fn()
            genome.mutateBiasRandom = jest.fn()
            genome.mutateBiasShift = jest.fn()
            genome.mutateConnection = jest.fn()
            genome.mutateDeleteConnection = jest.fn()
            genome.mutateDeleteNode = jest.fn()
            genome.mutateDisableConnection = jest.fn()
            genome.mutateInterpose = jest.fn()
            genome.mutateWeightRandom = jest.fn()
            genome.mutateWeightShift = jest.fn()
            return genome
        }
        const getNeat = () => ({
            probs: {
                weightMutationChance: 0,
                weightShiftChance: 0,
                biasMutationChance: 0,
                biasShiftChance: 0,
                addConnectionChance: 0,
                addRecurrentChance: 0,
                reEnableConnectionChance: 0,
                disableConnectionChance: 0,
                addNodeChance: 0,
                deleteConnectionChance: 0,
                deleteNodeChance: 0,
                randomActivationChance: 0,
            },
            hyper: {
                weightShiftStrength: 0.2,
                biasShiftStrength: 0.2,
            }
        })
        describe('mutate', () => {
            it('should call mutateActivation when Math.random() < randomActivationChance', () => {
                global.Math.random = () => randomVal
                const genome = getMockMutationGenome()
                const neat = getNeat(genome)
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(0)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(0)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(0)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(0)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(0)
                neat.probs.randomActivationChance = 1
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(1)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(0)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(0)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(0)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(0)
            })
            it('should call mutateBiasShift when Math.random() < biasMutationChance & biasShiftChance', () => {
                global.Math.random = () => randomVal
                const genome = getMockMutationGenome()
                const neat = getNeat(genome)
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(0)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(0)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(0)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(0)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(0)
                neat.probs.biasMutationChance = 1
                neat.probs.biasShiftChance = 1
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(0)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(1)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(0)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(0)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(0)
            })
            it('should call mutateBiasShift when Math.random() < biasMutationChance & Math.random()> biasShiftChance', () => {
                global.Math.random = () => randomVal
                const genome = getMockMutationGenome()
                const neat = getNeat(genome)
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(0)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(0)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(0)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(0)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(0)
                neat.probs.biasMutationChance = 1
                neat.probs.biasShiftChance = 0
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(0)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(0)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(1)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(0)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(0)
            })
            it('should call mutateBiasShift when Math.random() < weightMutationChance & weightShiftChance', () => {
                global.Math.random = () => randomVal
                const genome = getMockMutationGenome()
                const neat = getNeat(genome)
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(0)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(0)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(0)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(0)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(0)
                neat.probs.weightMutationChance = 1
                neat.probs.weightShiftChance = 1
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(0)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(0)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(0)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(1)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(0)
            })
            it('should call mutateBiasShift when Math.random() < weightMutationChance & Math.random()> weightShiftChance', () => {
                global.Math.random = () => randomVal
                const genome = getMockMutationGenome()
                const neat = getNeat(genome)
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(0)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(0)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(0)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(0)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(0)
                neat.probs.weightMutationChance = 1
                neat.probs.weightShiftChance = 0
                genome.mutate(neat)
                expect(genome.mutateActivation.mock.calls.length).toBe(0)
                expect(genome.mutateBiasShift.mock.calls.length).toBe(0)
                expect(genome.mutateBiasRandom.mock.calls.length).toBe(0)
                expect(genome.mutateWeightShift.mock.calls.length).toBe(0)
                expect(genome.mutateWeightRandom.mock.calls.length).toBe(1)
            })
        })
        describe('mutateActivation', () => {
            it('should mutate a random nodes activation function to a random allowed activation function', () => {
                const genome = getXorGenome()
                const allowed = ['sig']
                const preMutatedNodesCount = genome.nodes.filter(n => n.activation == aNm['sig']).length
                genome.mutateActivation(allowed)
                const postMutatedNodesCount = genome.nodes.filter(n => n.activation == aNm['sig']).length
                expect(preMutatedNodesCount + 1).toBe(postMutatedNodesCount)
            })
        })
        describe('mutateBiasShift', () => {
            it('should "shift" random nodes bias by random amnt, within shift strength amnt', () => {
                const genome = getXorGenome()
                for (let i = 0; i < 100; i++) {
                    const preBiases = genome.nodes.map(n => n.bias)
                    genome.mutateBiasShift(0.3)
                    const postBiases = genome.nodes.map(n => n.bias)
                    let shiftCount = 0
                    for (let j = 0; j < preBiases.length; j++) {
                        if (preBiases[j] != postBiases[j]) {
                            shiftCount++
                            const diff = Math.abs(preBiases[j] - postBiases[j])
                            expect(diff <= Math.abs(0.3 * preBiases[j])).toBe(true)
                        }
                    }
                    expect(shiftCount <= 1).toBe(true)
                }
            })
        })
        describe('mutateBiasRandom', () => {
            it('should set random nodes bias to random value within min & max', () => {
                const genome = getXorGenome()
                for (let i = 0; i < 100; i++) {
                    const preBiases = genome.nodes.map(n => n.bias)
                    genome.mutateBiasRandom(-100, 100)
                    const postBiases = genome.nodes.map(n => n.bias)
                    let shiftCount = 0
                    for (let j = 0; j < preBiases.length; j++) {
                        if (preBiases[j] != postBiases[j]) {
                            shiftCount++
                            expect(postBiases[j] >= -100 && postBiases[j] <= 100).toBe(true)
                        }
                    }
                    expect(shiftCount).toBe(1)
                }
            })

        })
        describe('mutateWeightShift', () => {
            it('should "shift" random connections weight by random amnt, within shift strength amnt proportional to current value', () => {
                const genome = getXorGenome()
                for (let i = 0; i < 100; i++) {
                    const preWeights = genome.connections.map(c => c.weight)
                    genome.mutateWeightShift(0.3)
                    const postWeights = genome.connections.map(c => c.weight)
                    let shiftCount = 0
                    for (let j = 0; j < preWeights.length; j++) {
                        if (preWeights[j] != postWeights[j]) {
                            shiftCount++
                            const diff = Math.abs(preWeights[j] - postWeights[j])
                            expect(diff <= Math.abs(0.3 * preWeights[j])).toBe(true)
                        }
                    }
                    expect(shiftCount <= 1).toBe(true)
                }
            })
        })
        describe('mutateWeightRandom', () => {
            it('should set random connections weight by random amnt within min & max', () => {
                const genome = getXorGenome()
                for (let i = 0; i < 100; i++) {
                    const preWeights = genome.connections.map(c => c.weight)
                    genome.mutateWeightRandom(-100, 100)
                    const postWeights = genome.connections.map(c => c.weight)
                    let shiftCount = 0
                    for (let j = 0; j < preWeights.length; j++) {
                        if (preWeights[j] != postWeights[j]) {
                            shiftCount++
                            expect(postWeights[j] >= -100 && postWeights[j] <= 100).toBe(true)
                        }
                    }
                    expect(shiftCount).toBe(1)
                }
            })
        })
    })
    describe("copy", () => {
        it('should return a de-referenced replica of the genome', () => {
            const genome = getXorGenome()
            genome.species = 5
            const copy = genome.copy()
            expect(copy.nodes.map(n => n.toJson()).join(' ')).toBe(genome.nodes.map(n => n.toJson()).join(' '))
            expect(copy.connections.map(c => c.toJson()).join(' ')).toBe(genome.connections.map(c => c.toJson()).join(' '))
            expect(JSON.stringify(copy.connectionMap)).toBe(JSON.stringify(genome.connectionMap))
            expect(JSON.stringify(copy.nodeMap)).toBe(JSON.stringify(genome.nodeMap))
            expect(copy.species).toBe(genome.species)
            expect(JSON.stringify(copy.layers)).toBe(JSON.stringify(genome.layers))
        })
    })
    describe("toJson", () => {
        it('should return json copy of all genome nodes & connections + species', () => {
            const genome = getXorGenome()
            genome.species = 5
            const data = JSON.parse(genome.toJson())
            expect(data.nodes.map(n => Node.FromJson(n).toJson()).join(' ')).toBe(genome.nodes.map(n => n.toJson()).join(' '))
            expect(data.connections.map(c => Connection.FromJson(c).toJson()).join(' ')).toBe(genome.connections.map(c => c.toJson()).join(' '))
            expect(data.species).toBe(genome.species)
        })
    })
    describe("FromJson", () => {
        it('should return a new Genome with all properties from json', () => {
            const genome = getXorGenome()
            genome.species = 5
            const newGenome = Genome.FromJson(genome.toJson())
            expect(newGenome.nodes.map(n => n.toJson()).join(' ')).toBe(genome.nodes.map(n => n.toJson()).join(' '))
            expect(newGenome.connections.map(c => c.toJson()).join(' ')).toBe(genome.connections.map(c => c.toJson()).join(' '))
            expect(JSON.stringify(newGenome.connectionMap)).toBe(JSON.stringify(genome.connectionMap))
            expect(JSON.stringify(newGenome.nodeMap)).toBe(JSON.stringify(genome.nodeMap))
            expect(newGenome.species).toBe(genome.species)
            expect(JSON.stringify(newGenome.layers)).toBe(JSON.stringify(genome.layers))
        })
    })
})