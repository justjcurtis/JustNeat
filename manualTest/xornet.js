const { randomRange } = require("../helpers/mathHelper");
const Client = require("../models/client");
const Connection = require("../models/neatConnection");
const Genome = require("../models/neatGenome");
const Node = require("../models/neatNode");
const NodeType = require("../models/nodeType");

const getxorClient = (random = true) => {
    const nodes = []
    nodes.push(new Node(0, NodeType.input, 0))
    nodes.push(new Node(1, NodeType.input, 0))
    nodes.push(new Node(2, NodeType.hidden, random ? randomRange(-100, 100) : -10))
    nodes.push(new Node(3, NodeType.hidden, random ? randomRange(-100, 100) : 30))
    nodes.push(new Node(4, NodeType.output, random ? randomRange(-100, 100) : -30))
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].activation = 1
    }
    const connections = []
    connections.push(new Connection(nodes[0].id, nodes[2].id, random ? randomRange(-100, 100) : 20, 0))
    connections.push(new Connection(nodes[0].id, nodes[3].id, random ? randomRange(-100, 100) : -20, 1))

    connections.push(new Connection(nodes[1].id, nodes[2].id, random ? randomRange(-100, 100) : 20, 2))
    connections.push(new Connection(nodes[1].id, nodes[3].id, random ? randomRange(-100, 100) : -20, 3))

    connections.push(new Connection(nodes[2].id, nodes[4].id, random ? randomRange(-100, 100) : 20, 4))
    connections.push(new Connection(nodes[3].id, nodes[4].id, random ? randomRange(-100, 100) : 20, 5))

    const xorGenome = new Genome(nodes, connections)

    const xorClient = new Client(xorGenome)
    return xorClient
}

module.exports = getxorClient;

const xorClient = getxorClient(false)
console.log((xorClient.predict([1, 1], false)[0]), 0) // 0
console.log((xorClient.predict([0, 1], false)[0]), 1) // 1
console.log((xorClient.predict([1, 0], false)[0]), 1) // 1
console.log((xorClient.predict([0, 0], false)[0]), 0) // 0


const xorFitness = (client) => {
    const pA = (client.predict([1, 1], false)[0]) // 0
    const pB = (client.predict([0, 1], false)[0]) // 1
    const pC = (client.predict([1, 0], false)[0]) // 1
    const pD = (client.predict([0, 0], false)[0]) // 0
    const a = -Math.abs(pA)
    const b = -Math.abs(pB - 1)
    const c = -Math.abs(pC - 1)
    const d = -Math.abs(pD)
        // if (pA == pB && pB == pC && pC == pD) return -100
    return (a + b + c + d)
}

console.log(xorFitness(xorClient))