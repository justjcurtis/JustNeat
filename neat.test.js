const NodeType = require("./models/nodeType")
const Neat = require("./neat")

describe('neat', () => {
    describe('ctor', () => {
        it('should return new neat instance with specified inputs and outputs', () => {
            const neat = new Neat(3, 2)
            for (let i = 0; i < neat.pop.length; i++) {
                expect(neat.pop[i].genome.nodes.filter(n => n.type == NodeType.input).length == 3)
                expect(neat.pop[i].genome.nodes.filter(n => n.type == NodeType.output).length == 2)
            }
            expect(neat.probs.addRecurrentChance).toBe(0)
        })
        it('should return new neat instance with specified opts', () => {
            const neat = new Neat(3, 2, {
                maxPop: 2341,
                recurrent: true,
                hyper: {
                    threshold: 8
                },
                probs: {
                    weightShiftChance: 0.01
                }
            })
            expect(neat.pop.length).toBe(2341)
            expect(neat.probs.addRecurrentChance).toBe(0.5)
            expect(neat.probs.weightShiftChance).toBe(0.01)
            expect(neat.hyper.threshold).toBe(8)
        })
    })
    describe('FromJson', () => {
        it('should return new neat replica of given json', () => {
            const expected = new Neat(3, 2, {
                maxPop: 241,
                recurrent: true,
                hyper: {
                    threshold: 8
                },
                probs: {
                    weightShiftChance: 0.01
                }
            })
            const result = Neat.FromJson(expected.toJson())
            expect(result.nextPruneComplexity).toBe(expected.nextPruneComplexity)
            expect(result.pruning).toBe(expected.pruning)
            expect(result.lastMCP).toBe(expected.lastMCP)
            expect(result.mcpFloorCount).toBe(expected.mcpFloorCount)
            expect(result.lastPopFitness).toBe(expected.lastPopFitness)
            expect(result.currentPopFitness).toBe(expected.currentPopFitness)
            expect(result.fitnessPlatauCount).toBe(expected.fitnessPlatauCount)
            expect(result.hyper).toStrictEqual(expected.hyper)
            expect(result.probs).toStrictEqual(expected.probs)
            expect(result.connectionPool).toStrictEqual(expected.connectionPool)
            expect(result.connections.map(c => c.toJson())).toStrictEqual(expected.connections.map(c => c.toJson()))
            expect(result.nodePool.map(n => n.toJson())).toStrictEqual(expected.nodePool.map(n => n.toJson()))
            expect(Object.entries(result.replacePool).map(r => [r[0], r[1].toJson()])).toStrictEqual(Object.entries(expected.replacePool).map(r => [r[0], r[1].toJson()]))
            expect(result.pop.map(c => c.genome.toJson())).toStrictEqual(expected.pop.map(c => c.genome.toJson()))
            expect(result.prevSpecScores).toStrictEqual(expected.prevSpecScores)
            expect(result.dropoffTracker).toStrictEqual(expected.dropoffTracker)
            expect(result.mandatoryNodes.map(n => n.toJson())).toStrictEqual(expected.mandatoryNodes.map(n => n.toJson()))
            expect(result.currentConnections).toBe(expected.currentConnections)
            expect(result.inputs).toBe(expected.inputs)
            expect(result.outputs).toBe(expected.outputs)
            expect(result.outputActivation).toBe(expected.outputActivation)
            expect(result.hiddenActivation).toBe(expected.hiddenActivation)
            expect(result.allowedActivations).toStrictEqual(expected.allowedActivations)
            expect(result.lossFn).toBe(expected.lossFn)
            expect(result.maxPop).toBe(expected.maxPop)
        })
    })
    describe('toJson', () => {
        it('should return json representation with all neat data', () => {
            const neat = new Neat(3, 2, {
                maxPop: 241,
                recurrent: true,
                hyper: {
                    threshold: 8
                },
                probs: {
                    weightShiftChance: 0.01
                }
            })
            const data = JSON.parse(neat.toJson())
            expect(data.nextPruneComplexity).toBe(neat.nextPruneComplexity)
            expect(data.pruning).toBe(neat.pruning)
            expect(data.lastMCP).toBe(neat.lastMCP)
            expect(data.mcpFloorCount).toBe(neat.mcpFloorCount)
            expect(data.lastPopFitness).toBe(neat.lastPopFitness)
            expect(data.currentPopFitness).toBe(neat.currentPopFitness)
            expect(data.fitnessPlatauCount).toBe(neat.fitnessPlatauCount)
            expect(data.hyper).toStrictEqual(neat.hyper)
            expect(data.probs).toStrictEqual(neat.probs)
            expect(data.connectionPool).toStrictEqual(neat.connectionPool)
            expect(data.connections).toStrictEqual(neat.connections.map(c => c.toJson()))
            expect(data.nodePool).toStrictEqual(neat.nodePool.map(n => n.toJson()))
            expect(data.replacePool).toStrictEqual(Object.entries(neat.replacePool).map(r => [r[0], r[1].toJson()]))
            expect(data.pop).toStrictEqual(neat.pop.map(c => c.genome.toJson()))
            expect(data.prevSpecScores).toStrictEqual(neat.prevSpecScores)
            expect(data.dropoffTracker).toStrictEqual(neat.dropoffTracker)
            expect(data.mandatoryNodes).toStrictEqual(neat.mandatoryNodes.map(n => n.toJson()))
            expect(data.currentConnections).toBe(neat.currentConnections)
            expect(data.inputs).toBe(neat.inputs)
            expect(data.outputs).toBe(neat.outputs)
            expect(data.outputActivation).toBe(neat.outputActivation)
            expect(data.hiddenActivation).toBe(neat.hiddenActivation)
            expect(data.allowedActivations).toStrictEqual(neat.allowedActivations)
            expect(data.lossFn).toBe(neat.lossFn)
            expect(data.maxPop).toBe(neat.maxPop)
        })
    })
    describe('reset', () => {
        // TODO: add tests
    })
    describe('getInnovationId', () => {
        // TODO: add tests
    })
    describe('newNode', () => {
        // TODO: add tests
    })
    describe('blankGenome', () => {
        // TODO: add tests
    })
    describe('addConnection', () => {
        // TODO: add tests
    })
    describe('interposeConnection', () => {
        // TODO: add tests
    })
    describe('mcp', () => {
        // TODO: add tests
    })
    describe('dist', () => {
        // TODO: add tests
    })
    describe('crossover', () => {
        // TODO: add tests
    })
    describe('speciate', () => {
        // TODO: add tests
    })
    describe('cull', () => {
        // TODO: add tests
    })
    describe('breed', () => {
        // TODO: add tests
    })
    describe('mutate', () => {
        // TODO: add tests
    })
    describe('populateGenomeCosts', () => {
        // TODO: add tests
    })
    describe('evolve', () => {
        // TODO: add tests
    })
    describe('trainFnStep', () => {
        // TODO: add tests
    })
    describe('trainFn', () => {
        // TODO: add tests
    })
    describe('trainDataStep', () => {
        // TODO: add tests
    })
    describe('trainData', () => {
        // TODO: add tests
    })
})