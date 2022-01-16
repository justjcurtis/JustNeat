const Connection = require("./neatConnection")

describe('neatConnection', () => {
    const getConnections = () => [
        [new Connection(0, 1, 0.1, 0)],
        [new Connection(1, 4, 0.0001, 11, true)],
        [new Connection(1, 4, 0.0001, 11, true, false)],
        [new Connection(2, 6, -0.15, 123, false, true)],
        [new Connection(3, 11, 1.1, 456789, true, true)],
    ]
    describe('ctor', () => {
        const newConnectionTestData = [
            [
                [0, 1, 0.1, 0]
            ],
            [
                [1, 4, 0.0001, 11, true]
            ],
            [
                [1, 4, 0.0001, 11, true, false]
            ],
            [
                [2, 6, -0.15, 123, false, true]
            ],
            [
                [3, 11, 1.1, 456789, true, true]
            ],
        ]
        test.each(newConnectionTestData)('should return new Connection with expected props', (args) => {
            const recurrent = args.length > 4 ? args[4] : false
            const enabled = args.length > 5 ? args[5] : true
            let con = new Connection(...args)
            expect(con.inNode).toBe(args[0])
            expect(con.outNode).toBe(args[1])
            expect(con.weight).toBe(args[2])
            expect(con.innov).toBe(args[3])
            expect(con.recurrent).toBe(recurrent)
            expect(con.enabled).toBe(enabled)
        })
    })
    describe('copy', () => {
        test.each(getConnections())('given a connection .copy() should return a de-referenced replica', (con) => {
            const copy = con.copy()
            expect(copy.inNode).toBe(con.inNode)
            expect(copy.outNode).toBe(con.outNode)
            expect(copy.weight).toBe(con.weight)
            expect(copy.innov).toBe(con.innov)
            expect(copy.recurrent).toBe(con.recurrent)
            expect(copy.enabled).toBe(con.enabled)
            copy.inNode--;
            copy.outNode++;
            copy.weight += 1.123
            copy.innov++;
            copy.recurrent = !copy.recurrent
            copy.enabled = !copy.enabled
            expect(copy.inNode).not.toBe(con.inNode)
            expect(copy.outNode).not.toBe(con.outNode)
            expect(copy.weight).not.toBe(con.weight)
            expect(copy.innov).not.toBe(con.innov)
            expect(copy.recurrent).not.toBe(con.recurrent)
            expect(copy.enabled).not.toBe(con.enabled)
        })
    })
})