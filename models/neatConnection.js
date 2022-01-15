class Connection {
    constructor(inNode, outNode, weight, innov, recurrent = false, enabled = true) {
        this.inNode = inNode
        this.outNode = outNode
        this.id = `${inNode},${outNode}`
        this.weight = weight
        this.recurrent = recurrent
        this.enabled = enabled
        this.outputCache = 0
        this.innov = innov
    }

    static Equal(a, b) {
        return a.innov == b.innov
    }

    static FromJson(json) {
        const data = JSON.parse(json)
        return new Connection(data.inNode, data.outNode, data.weight, data.innov, data.recurrent, data.enabled)
    }

    copy() {
        return new Connection(this.inNode, this.outNode, this.weight, this.innov, this.recurrent, this.enabled)
    }

    toJson() {
        return JSON.stringify({
            inNode: this.inNode,
            outNode: this.outNode,
            id: this.id,
            weight: this.weight,
            enabled: this.enabled,
            recurrent: this.recurrent,
            outputCache: this.outputCache,
            innov: this.innov
        })
    }
}

module.exports = Connection