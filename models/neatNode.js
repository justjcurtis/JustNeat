const { aNm } = require("../helpers/activationHelper")
const NodeType = require("./nodeType")

class Node {
    constructor(id, type, bias) {
        this.id = id
        this.bias = bias
        this.type = type
        this.layer = type == NodeType.input ? 0 : null
        this.activation = type == NodeType.hidden ? aNm.tanh : aNm.id
    }

    static Equal(a, b) {
        return a.id == b.id
    }

    static FromJson(json) {
        const data = JSON.parse(json)
        const n = new Node(data.id, data.type, data.bias)
        n.layer = data.layer
        n.activation = data.activation
        return n
    }

    copy() {
        const n = new Node(this.id, this.type, this.bias)
        n.activation = this.activation
        n.layer = this.layer
        return n
    }

    toJson() {
        return JSON.stringify({
            id: this.id,
            type: this.type,
            bias: this.bias,
            layer: this.layer,
            activation: this.activation
        })
    }
}

module.exports = Node