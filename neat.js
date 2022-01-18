const Node = require('./models/neatNode')
const Connection = require('./models/neatConnection')
const Genome = require('./models/neatGenome')
const Client = require('./models/client')
const NodeType = require('./models/nodeType')
const { randomRange } = require('./helpers/mathHelper')
const { rouletteSelectClientArray } = require('./helpers/arrHelper')
const { aNm } = require('./helpers/activationHelper')
const { lFn, lNm } = require('./helpers/lossHelper')

const defaultHyper = {
    c1: 1,
    c2: 1,
    c3: 0.4,
    weightShiftStrength: 0.2,
    biasShiftStrength: 0.2,
    threshold: 10,
    speciesTarget: 50,
    initialMutation: 1,
    cullRate: 0.5,
    minWeight: -100,
    maxWeight: 100,
    minBias: -100,
    maxBias: 100,
    elitism: 0.01,
    dropoff: 15,
    dropRate: 0,
    cloneRate: 0.25,
    complexityThreshold: 30,
    complexityFloorDelay: 10,
    fitnessPlatauThreshold: 10,
    connectionCost: 0.1,
    nodeCost: 0.2

}

const defaultProbs = {
    weightMutationChance: 0.8,
    weightShiftChance: 0.9,
    biasMutationChance: 0.8,
    biasShiftChance: 0.9,
    addConnectionChance: 0.05,
    addRecurrentChance: 0.5,
    reEnableConnectionChance: 0.25,
    disableConnectionChance: 0.05,
    addNodeChance: 0.025,
    deleteConnectionChance: 0.05,
    deleteNodeChance: 0.025,
    randomActivationChance: 0.05,
}

const defaultOpts = {
    maxPop: 1000,
    recurrent: false,
    outputActivation: 'tanh',
    hiddenActivation: 'tanh',
    allowedActivations: [
        'id',
        'sig',
        'tanh',
        'relu',
        'bin',
        'gelu',
        'softPlus',
        'invert',
        'softSign',
        'bipolSig',
    ],
    lossFn: 'mse',
    hyper: {},
    probs: {}
}

class Neat {
    constructor(inputs, outputs, opts, fromJSON = false) {
        opts = {...defaultOpts, ...opts }
        this.inputs = inputs
        this.outputs = outputs
        this.outputActivation = opts.outputActivation
        this.hiddenActivation = opts.hiddenActivation
        this.allowedActivations = opts.allowedActivations
        this.lossFn = opts.lossFn
        this.maxPop = opts.maxPop
        this.pop = []
        this.connectionPool = {}
        this.connections = []
        this.replacePool = {}
        this.currentConnections = 0
        this.nodePool = []
        this.mandatoryNodes = []
        this.hyper = {...defaultHyper, ...opts.hyper }
        this.probs = {...defaultProbs, ...opts.probs }
        if (!opts.recurrent) this.probs.addRecurrentChance = 0
        this.prevSpecScores = {}
        this.dropoffTracker = {}
        this.nextPruneComplexity = 0
        this.pruning = false
        this.lastMCP = 0
        this.mcpFloorCount = 0
        this.lastPopFitness = 0
        this.currentPopFitness = 0
        this.fitnessPlatauCount = 0
        if (!fromJSON) this.reset()
    }

    static FromJson(json) {
        const data = JSON.parse(json)
        const opts = {
            maxPop: data.maxPop,
            recurrent: data.hyper.addRecurrentChance == 0,
            outputActivation: data.outputActivation,
            hiddenActivation: data.hiddenActivation,
            allowedActivations: data.allowedActivations,
            lossFn: data.lossFn,
            hyper: data.hyper,
            probs: data.probs,
        }
        const neat = new Neat(data.inputs, data.outputs, opts, true)
        const replacePool = {}
        for (let i = 0; i < data.replacePool.length; i++) {
            replacePool[data.replacePool[i][0]] = Node.FromJson(data.replacePool[i][1])
        }
        neat.replacePool = replacePool
        neat.pop = data.pop.map(json => new Client(Genome.FromJson(json)))
        neat.nodePool = data.nodePool.map(json => Node.FromJson(json))
        neat.mandatoryNodes = data.mandatoryNodes.map(json => Node.FromJson(json))
        neat.connections = data.connections.map(json => Connection.FromJson(json))
        neat.connectionPool = data.connectionPool
        neat.nextPruneComplexity = data.nextPruneComplexity
        neat.pruning = data.pruning
        neat.lastMCP = data.lastMCP
        neat.mcpFloorCount = data.mcpFloorCount
        neat.lastPopFitness = data.lastPopFitness
        neat.currentPopFitness = data.currentPopFitness
        neat.fitnessPlatauCount = data.fitnessPlatauCount
        neat.prevSpecScores = data.prevSpecScores
        neat.dropoffTracker = data.dropoffTracker
        neat.currentConnections = data.currentConnections
        return neat
    }

    toJson() {
        return JSON.stringify({
            nextPruneComplexity: this.nextPruneComplexity,
            pruning: this.pruning,
            lastMCP: this.lastMCP,
            mcpFloorCount: this.mcpFloorCount,
            lastPopFitness: this.lastPopFitness,
            currentPopFitness: this.currentPopFitness,
            fitnessPlatauCount: this.fitnessPlatauCount,
            hyper: this.hyper,
            probs: this.probs,
            connectionPool: this.connectionPool,
            connections: this.connections.map(c => c.toJson()),
            nodePool: this.nodePool.map(n => n.toJson()),
            replacePool: Object.entries(this.replacePool).map(r => [r[0], r[1].toJson()]),
            pop: this.pop.map(c => c.genome.toJson()),
            prevSpecScores: this.prevSpecScores,
            dropoffTracker: this.dropoffTracker,
            mandatoryNodes: this.mandatoryNodes.map(n => n.toJson()),
            currentConnections: this.currentConnections,
            inputs: this.inputs,
            outputs: this.outputs,
            outputActivation: this.outputActivation,
            hiddenActivation: this.hiddenActivation,
            allowedActivations: this.allowedActivations,
            lossFn: this.lossFn,
            maxPop: this.maxPop,
        })
    }

    reset() {
        const outputNodes = []
        for (let i = 0; i < this.outputs; i++) {
            const node = new Node(i + this.inputs, NodeType.output, randomRange(this.hyper.minBias, this.hyper.maxBias))
            node.activation = aNm[this.outputActivation]
            outputNodes.push(node)
        }

        const inputNodes = []
        this.connections = []
        this.connectionPool = {}
        this.currentConnections = 0
        this.replacePool = {}
        this.prevSpecScores = {}
        this.dropoffTracker = {}

        for (let i = 0; i < this.inputs; i++) {
            const node = new Node(i, NodeType.input, randomRange(this.hyper.minBias, this.hyper.maxBias))
            inputNodes.push(node)
            for (let j = 0; j < outputNodes.length; j++) {
                this.connectionPool[`${node.id},${outputNodes[j].id}`] = this.currentConnections
                this.connections.push(new Connection(node.id, outputNodes[j].id, randomRange(this.hyper.minBias, this.hyper.maxBias), this.currentConnections))
                this.currentConnections++
            }
        }

        this.nodePool = [...inputNodes, ...outputNodes]
        this.mandatoryNodes = this.nodePool.slice(0)
        this.pop = []
        for (let i = 0; i < this.maxPop; i++) {
            const g = this.blankGenome()
            for (let j = 0; j < this.hyper.initialMutation; j++) {
                g.augment(this)
            }
            this.pop.push(new Client(g))
        }
        const currentMCP = this.mcp()
        this.nextPruneComplexity = currentMCP + this.hyper.complexityThreshold
        this.pruning = false
        this.lastMCP = 0
        this.mcpFloorCount = 0
        this.lastPopFitness = 0
        this.currentPopFitness = 0
        this.fitnessPlatauCount = 0
    }

    getInnovationId(inNodeId, outNodeId) {
        const id = `${inNodeId},${outNodeId}`
        if (this.connectionPool[id]) return this.connectionPool[id]
        this.connectionPool[id] = this.currentConnections
        this.currentConnections++;
        return this.currentConnections - 1
    }

    newNode(type) {
        const node = new Node(this.nodePool.length, type, randomRange(this.hyper.minBias, this.hyper.maxBias))
        for (let i = 0; i < this.nodePool.length; i++) {
            const current = this.nodePool[i]
            if (current.type < node.type) continue
            if (current.type == node.type) {
                if (current.id < node.id) continue
                this.nodePool.splice(i, 0, node)
                break
            }
            this.nodePool.splice(i, 0, node)
            break
        }
        return node
    }

    blankGenome() {
        const nodes = this.mandatoryNodes.slice(0)
        for (let i = 0; i < nodes.length; i++) {
            nodes[i] = nodes[i].copy()
            nodes[i].bias = randomRange(this.hyper.minBias, this.hyper.maxBias)
        }

        const connections = this.connections.slice(0)
        for (let i = 0; i < connections.length; i++) {
            connections[i] = connections[i].copy()
            connections[i].weight = randomRange(this.hyper.minWeight, this.hyper.maxWeight)
        }
        return new Genome(nodes, connections)
    }

    addConnection(genome, inNode, outNode, weight = undefined) {
        if (inNode.layer == outNode.layer) return false
        if (inNode.layer > outNode.layer && Math.random() >= this.probs.addRecurrentChance) return false

        const id = `${inNode.id},${outNode.id}`
        if (genome.connectionMap[id] != undefined) {
            if (Math.random() >= this.hyper.reEnableConnectionChance) return false
            genome.connections[genome.connectionMap[id]].enabled = true
            return true
        }
        const w = weight == undefined ? randomRange(this.hyper.minWeight, this.hyper.maxWeight) : weight
        const innov = this.getInnovationId(inNode.id, outNode.id)
        const connection = new Connection(inNode.id, outNode.id, w, innov, inNode.layer > outNode.layer)
        genome.connectionMap[connection.id] = genome.connections.length
        genome.connections.push(connection)
        return true
    }

    interposeConnection(genome, connection) {
        let node;
        if (this.replacePool[connection.id] != undefined) {
            node = this.replacePool[connection.id].copy()
        } else {
            node = this.newNode(NodeType.hidden)
            node.activation = aNm[this.hiddenActivation]
            this.replacePool[connection.id] = node
        }
        const innovA = this.getInnovationId(connection.inNode, node.id)
        const innovB = this.getInnovationId(node.id, connection.outNode)
        const connectionA = new Connection(connection.inNode, node.id, 1, innovA)
        const connectionB = new Connection(node.id, connection.outNode, connection.weight, innovB)

        const i = genome.connectionMap[connection.id]
        genome.connections[i].enabled = false

        genome.connectionMap[connectionA.id] = genome.connections.length
        genome.connections.push(connectionA)
        genome.connectionMap[connectionB.id] = genome.connections.length
        genome.connections.push(connectionB)
        genome.nodeMap[node.id] = genome.nodes.length
        node.layer = genome.nodes[genome.nodeMap[connection.inNode]] + 1
        genome.nodes.push(node)
    }

    mcp() {
        return this.pop.reduce((acc, c) => acc + (c.genome.nodes.length + c.genome.connections.length), 0) / this.pop.length
    }

    dist(g1, g2) {
        let i1 = 0
        let i2 = 0

        const h1 = g1.connections.length > 0 ? g1.connections.slice(-1)[0].innov : 0
        const h2 = g2.connections.length > 0 ? g2.connections.slice(-1)[0].innov : 0
        if (h1 < h2) {
            const temp = g1
            g1 = g2
            g2 = temp
        }

        let disjoint = 0
        let similar = 0
        let weightDiff = 0

        while (i1 < g1.connections.length && i2 < g2.connections.length) {
            const a = g1.connections[i1]
            const b = g2.connections[i2]
            if (a.innov == b.innov) {
                similar++
                weightDiff += Math.abs(a.weight - b.weight)
                i1++
                i2++
                continue
            } else if (a.innov > b.innov) {
                disjoint++
                i2++
            } else {
                disjoint++
                i1++
            }
        }

        if (similar > 0) weightDiff /= similar
        let excess = g1.connections.length - i1
        let N = Math.max(g1.connections.length, g2.connections.length)
        if (N < 20) N = 1

        return ((this.hyper.c1 * disjoint) / N) + ((this.hyper.c2 * excess) / N) + (this.hyper.c3 * weightDiff)
    }

    crossover(g1, g2) {
        let i1 = 0
        let i2 = 0

        const newConnections = []
        const requiredNodes = Object.fromEntries(this.mandatoryNodes.map(n => [n.id, true]))

        while (i1 < g1.connections.length && i2 < g2.connections.length) {
            const a = g1.connections[i1]
            const b = g2.connections[i2]
            if (a.innov == b.innov) {
                if (Math.random() < 0.5) {
                    newConnections.push(a.copy())
                    requiredNodes[a.inNode] = true
                    requiredNodes[a.outNode] = true
                } else {
                    newConnections.push(b.copy())
                    requiredNodes[b.inNode] = true
                    requiredNodes[b.outNode] = true
                }
                i1++
                i2++
                continue
            } else if (a.innov < b.innov) {
                newConnections.push(a)
                requiredNodes[a.inNode] = true
                requiredNodes[a.outNode] = true
                i1++
            } else {
                i2++
            }
        }
        while (i1 < g1.connections.length) {
            const a = g1.connections[i1]
            newConnections.push(a.copy())
            requiredNodes[a.inNode] = true
            requiredNodes[a.outNode] = true
            i1++
        }

        const newNodes = []
        const requiredNodeIds = Object.keys(requiredNodes)
        for (let i = 0; i < requiredNodeIds.length; i++) {
            const id = requiredNodeIds[i]
            const ni1 = g1.nodeMap[id]
            const ni2 = g2.nodeMap[id]
            if (ni1 != undefined) {
                if (ni2 != undefined) {
                    if (Math.random() < 0.5) newNodes.push(g1.nodes[ni1].copy())
                    else newNodes.push(g2.nodes[ni2].copy())
                    continue
                }
                newNodes.push(g1.nodes[ni1].copy())
                continue
            }
            newNodes.push(g2.nodes[ni2].copy())
        }
        return new Genome(newNodes, newConnections, g1.species)
    }

    speciate() {
        let species = {}
        let maxCurrentSpecies = 0
        for (let i = 0; i < this.pop.length; i++) {
            const current = this.pop[i]
            if (current.genome.species == null) continue
            if (species[current.genome.species] != undefined) continue
            if (maxCurrentSpecies < current.genome.species) maxCurrentSpecies = current.genome.species
            species[current.genome.species] = [current]
        }
        popLoop:
            for (let i = 0; i < this.pop.length; i++) {
                const currentKnownSpecs = Object.keys(species)
                for (let j = 0; j < currentKnownSpecs.length; j++) {
                    const spec = currentKnownSpecs[j]
                    if (this.pop[i].genome == species[spec][0].genome) continue
                    const d = this.dist(this.pop[i].genome, species[spec][0].genome)
                    if (d > this.hyper.threshold) continue
                    this.pop[i].genome.species = spec
                    species[spec].push(this.pop[i])
                    continue popLoop
                }
                maxCurrentSpecies++
                this.pop[i].genome.species = maxCurrentSpecies
                species[maxCurrentSpecies] = [this.pop[i]]
            }

        species = Object.values(species)
        for (let i = 0; i < species.length; i++) {
            species[i].sort((a, b) => (b.score - b.genomeCost) - (a.score - a.genomeCost))
            for (let j = 0; j < species[i].length; j++) {
                species[i][j].genome.species = i
            }
        }
        return species
    }

    cull(species) {
        for (let i = 0; i < species.length; i++) {
            const max = Math.max(Math.floor((1 - this.hyper.cullRate) * species[i].length), 1)
            species[i] = species[i].slice(0, max)
        }
        species = species.filter(s => s.length > 0)
        return species
    }

    breed(species) {
        const children = []
        const adjustedFitness = species.map(s => s.map(c => {
            return c.score / s.length
        }))
        const sFit = adjustedFitness.map(s => s.reduce((acc, c) => acc + c, 0) / s.length)
        if (Math.random() < this.hyper.dropRate) {
            const dropIndex = sFit.indexOf(Math.min(...sFit))
            sFit[dropIndex] = 0
            if (this.dropoffTracker[dropIndex] != undefined) delete this.dropoffTracker[dropIndex]
            if (this.prevSpecScores[dropIndex] != undefined) delete this.prevSpecScores[dropIndex]
        }
        const gFit = adjustedFitness.reduce((acc, s) => acc + s.reduce((acc, c) => acc + c, 0), 0) / adjustedFitness.reduce((acc, s) => acc + s.length, 0)
        this.currentPopFitness = gFit
        for (let i = 0; i < sFit.length; i++) {
            if (this.prevSpecScores[i] == undefined) {
                this.prevSpecScores[i] = sFit[i]
                continue
            }
            if (sFit[i] <= this.prevSpecScores[i]) {
                if (!this.dropoffTracker[i]) this.dropoffTracker[i] = 0
                this.dropoffTracker[i]++;
                if (this.dropoffTracker[i] >= this.hyper.dropoff) {
                    sFit[i] = 0
                    delete this.dropoffTracker[i]
                    delete this.prevSpecScores[i]
                }
            } else if (this.dropoffTracker[i] != undefined) {
                delete this.dropoffTracker[i]
                delete this.prevSpecScores[i]
                continue
            }
            this.prevSpecScores[i] = sFit[i]

        }
        for (let i = 0; i < species.length; i++) {
            let n = Math.round((sFit[i] / gFit) * species[i].length)
            while (n > 0) {
                if (Math.random() < this.hyper.cloneRate) {
                    const c1 = rouletteSelectClientArray(species[i])
                    children.push(new Client(c1.genome.copy()))
                } else {
                    const c1 = rouletteSelectClientArray(species[i])
                    const c2 = rouletteSelectClientArray(species[i])
                    const parents = [c1, c2]
                    parents.sort((a, b) => b.score - a.score)
                    const childGenome = this.crossover(parents[0].genome, parents[1].genome)
                    children.push(new Client(childGenome))
                }
                n--
            }
        }
        return children
    }

    mutate() {
        if (!this.pruning) {
            for (let i = 0; i < this.pop.length; i++) {
                this.pop[i].genome.augment(this)
            }
        } else {
            for (let i = 0; i < this.pop.length; i++) {
                this.pop[i].genome.simplify(this)
            }
        }
    }

    populateGenomeCosts() {
        if (this.hyper.connectionCost == 0 && this.hyper.nodeCost == 0) return
        for (let i = 0; i < this.pop.length; i++) {
            const client = this.pop[i]
            client.genomeCost = (client.genome.connections.length * this.hyper.connectionCost) + (client.genome.nodes.length * this.hyper.nodeCost)
        }
    }

    evolve() {
        this.pop.sort((a, b) => (b.score - b.genomeCost) - (a.score - a.genomeCost))
        this.populateGenomeCosts()
        let species = this.speciate()
        const elite = this.pop.slice(0, Math.ceil(this.pop.length * this.hyper.elitism)).map(c => new Client(c.genome.copy()))
        if (species.length > this.hyper.speciesTarget) this.hyper.threshold++;
        if (species.length < this.hyper.speciesTarget) this.hyper.threshold--;
        species = this.cull(species)
        this.pop = this.breed(species)
        if (this.pop.length + elite.length < this.maxPop) {
            const blankCount = this.maxPop - (this.pop.length + elite.length)
            for (let i = 0; i < blankCount; i++) {
                const g = this.blankGenome()
                this.pop.push(new Client(g))
            }
        }
        this.mutate()
        this.pop = [...elite, ...this.pop]
        if (this.currentPopFitness > this.lastPopFitness) this.fitnessPlatauCount = 0
        else this.fitnessPlatauCount++;
        this.lastPopFitness = this.currentPopFitness
        const currentMCP = this.mcp()
        if (!this.pruning) {
            if (this.fitnessPlatauCount >= this.hyper.fitnessPlatauThreshold) {
                if (currentMCP >= this.nextPruneComplexity) {
                    this.pruning = true
                }
            }
        } else {
            if (currentMCP >= this.lastMCP) this.mcpFloorCount++;
            if (this.mcpFloorCount >= this.hyper.complexityFloorDelay) {
                this.pruning = false
                this.nextPruneComplexity = currentMCP + this.hyper.complexityThreshold
                this.fitnessPlatauCount = 0
            }
            this.lastMCP = currentMCP
        }
    }

    trainFnStep(getScore, best = -Infinity) {
        for (let i = 0; i < this.pop.length; i++) {
            const score = getScore(this.pop[i])
            this.pop[i].score = score
            if (score > best) {
                best = score
            }
        }
        return best
    }

    trainFn(getScore, goal, targetLoss = 0.01, log = false) {
        let best = -Infinity
        let gen = 0
        while (true) {
            const score = this.trainFnStep(getScore, best)
            if (score > best) {
                best = score
                if (log) {
                    const table = {}
                    table[gen] = { "Best score": best }
                    console.table(table)
                }
                if (goal - best <= targetLoss) break
            }
            this.evolve()
            gen++
        }
        this.pop.sort((a, b) => b.score - a.score)
        const client = this.pop[0]
        return { client, gen }
    }

    trainDataStep(trainingData, getLoss) {
        let minLoss = Infinity
        for (let i = 0; i < this.pop.length; i++) {
            const results = []
            for (let j = 0; j < trainingData.length; j++) {
                const [input, expected] = trainingData[j]
                const output = this.pop[i].predict(input)
                if (output.length != expected.length)
                    throw (`Training data output has wrong length: ${expected.length}, expected ${output.length}`)
                results.push([expected, output])
            }
            const loss = getLoss(results)
            this.pop[i].score = -1 * loss
            if (loss < minLoss) minLoss = loss
        }
        return minLoss
    }

    trainData(trainingData, targetLoss = 0.01, log = false, lossFnOverride = undefined) {
        if (lossFnOverride == undefined) lossFnOverride = lFn[lNm[this.lossFn]]
        let best = Infinity;
        let gen = 0;
        while (true) {
            const loss = this.trainDataStep(trainingData, lossFnOverride)
            if (loss < best) {
                best = loss
                if (log) {
                    const table = {}
                    table[gen] = { "Loss": best }
                    console.table(table)
                }
                if (best <= targetLoss) break
            }
            this.evolve()
            gen++
        }
        this.pop.sort((a, b) => b.score - a.score)
        const client = this.pop[0]
        return { client, gen }

    }

}

module.exports = Neat