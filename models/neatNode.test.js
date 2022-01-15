const { aNm } = require("../helpers/activationHelper")
const NodeType = require("./nodeType")
const Node = require('./neatNode')

describe('neatNode', () => {
    const getNodeTestData = () => [
        [new Node(0, NodeType.input, -10), 0],
        [new Node(5, NodeType.hidden, 20), 1],
        [new Node(5, NodeType.hidden, 20), null],
        [new Node(19, NodeType.output, 990), 2],
    ]
    describe('ctor', () => {
        const newNodeTestData = [
            [0, NodeType.input, -10],
            [5, NodeType.hidden, 20],
            [19, NodeType.output, 990],
        ]
        test.each(newNodeTestData)('new Node(%p, %p, %p) should return expected default node', (id, type, bias) => {
            const node = new Node(id, type, bias)
            expect(node.id).toBe(id)
            expect(node.type).toBe(type)
            expect(node.bias).toBe(bias)
            expect(node.activation).toBe(type == NodeType.hidden ? aNm.tanh : aNm.id)
            expect(node.layer).toBe(type == NodeType.input ? 0 : null)
        })
    })
    describe('copy', () => {
        test.each(getNodeTestData())('Given a node copy should return a new identical de-referenced node', (node, layer) => {
            node.layer = layer
            const copy = node.copy()
            expect(copy.id).toBe(node.id)
            expect(copy.type).toBe(node.type)
            expect(copy.bias).toBe(node.bias)
            expect(copy.activation).toBe(node.activation)
            expect(copy.layer).toBe(node.layer)
            copy.id = 3
            copy.type = 0
            copy.bias = -Infinity
            copy.activation = 'lol'
            copy.layer = -1
            expect(copy.id).not.toBe(node.id)
            expect(copy.type).not.toBe(node.type)
            expect(copy.bias).not.toBe(node.bias)
            expect(copy.activation).not.toBe(node.activation)
            expect(copy.layer).not.toBe(node.layer)
        })
    })
    describe('toJson', () => {
        test.each(getNodeTestData())('given node node.toJson() should return expected json', (node) => {
            const json = node.toJson()
            const data = JSON.parse(json)
            expect(data.id).toBe(node.id)
            expect(data.type).toBe(node.type)
            expect(data.bias).toBe(node.bias)
            expect(data.activation).toBe(node.activation)
            expect(data.layer).toBe(node.layer)
        })
    })
    describe('FromJson', () => {
        test.each(getNodeTestData())('given node Node.FromJson(node.toJson()) should return copy of node', (node) => {
            const newNode = Node.FromJson(node.toJson())
            expect(newNode.id).toBe(node.id)
            expect(newNode.type).toBe(node.type)
            expect(newNode.bias).toBe(node.bias)
            expect(newNode.activation).toBe(node.activation)
            expect(newNode.layer).toBe(node.layer)
        })
    })
})