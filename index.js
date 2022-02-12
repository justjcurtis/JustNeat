const Neat = require('./neat')
const config = require('./models/config')
const Client = require('./models/client')
const Genome = require('./models/neatGenome')
const Node = require('./models/neatNode')
const Connection = require('./models/neatConnection')
const NodeType = require('./models/nodeType')

module.exports = {
    Client,
    Connection,
    Genome,
    Neat,
    Node,
    NodeType,
    config
}