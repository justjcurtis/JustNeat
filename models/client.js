const { aFn } = require('../helpers/activationHelper')

class Client {
    constructor(genome) {
        this.genome = genome
        this.score = -Infinity
    }

    getInputValue(node, graph) {
        let value = 0
        for (let p = 0; p < graph[node.id].parents.length; p++) {
            const parentCon = graph[node.id].parents[p]
            if (!parentCon.enabled) continue
            if (parentCon.recurrent) value += parentCon.outputCache
            else value += graph[parentCon.inNode].value * parentCon.weight
        }
        return value
    }

    setRecurrentOutputCaches(graph) {
        const recurrentConnections = this.genome.connections.filter(con => con.recurrent)
        for (let i = 0; i < recurrentConnections.length; i++) {
            const con = recurrentConnections[i]
            con.outputCache = graph[con.inNode].value
        }
    }

    getOutput(graph) {
        return this.genome.layers[this.genome.layers.length - 1].map(n => graph[n.id].value)
    }

    feedForward(inputs, graph) {
        const inputLayer = this.genome.layers[0]
        for (let i = 0; i < inputLayer.length; i++) {
            const node = inputLayer[i]
            let value = inputs[i] + this.getInputValue(node, graph)
            graph[node.id].value = value
        }
        for (let l = 1; l < this.genome.layers.length; l++) {
            const layer = this.genome.layers[l]
            for (let i = 0; i < layer.length; i++) {
                const node = layer[i]
                const value = this.getInputValue(node, graph)
                graph[node.id].value = aFn[node.activation](value + node.bias)
            }
        }
        this.setRecurrentOutputCaches(graph)
        return this.getOutput(graph)
    }

    predict(inputs) {
        if (inputs.length != this.genome.layers[0].length)
            throw (`Expected input size ${this.genome.layers[0].length} but received ${inputs.length}`)
        const graph = this.genome.getGraph()
        return this.feedForward(inputs, graph)
    }
}

module.exports = Client