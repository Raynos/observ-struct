var test = require("tape")
var Observ = require("observ")

var ObservHash = require("../index")

test("ObservHash is a function", function (assert) {
    assert.equal(typeof ObservHash, "function")
    assert.end()
})

test("observ contains correct initial value", function (assert) {
    var obj = ObservHash({
        foo: Observ("foo"),
        bar: Observ("bar")
    })

    var state = obj()
    assert.equal(state.foo, "foo")
    assert.equal(state.bar, "bar")

    assert.end()
})

test("observ emits change", function (assert) {
    var obj = ObservHash({
        foo: Observ("foo"),
        bar: Observ("bar")
    })
    var changes = []

    obj(function (state) {
        changes.push(state)
    })

    obj.foo.set("foo")
    obj.foo.set("foo2")
    obj.bar.set("bar2")

    assert.equal(changes.length, 3)
    assert.deepEqual(changes[0], {
        foo: "foo", bar: "bar"
    })
    assert.deepEqual(changes[1], {
        foo: "foo2", bar: "bar"
    })
    assert.deepEqual(changes[2], {
        foo: "foo2", bar: "bar2"
    })
    assert.notEqual(changes[0], changes[1])
    assert.notEqual(changes[1], changes[2])

    assert.end()
})

test("supports both observs and values", function (assert) {
    var obj = ObservHash({
        foo: Observ("foo"),
        bar: "bar"
    })
    
    assert.equal(typeof obj.foo, "function")
    assert.equal(obj.foo(), "foo")
    assert.equal(obj.bar, "bar")

    assert.end()
})

test("works with nested things", function (assert) {
    var obj = ObservHash({
        fruits: ObservHash({
            apples: Observ(3),
            oranges: Observ(5)
        }),
        customers: Observ(5)
    })
    var initialState = obj()
    var changes = []
    var fruitChanges = []

    obj(function (state) {
        changes.push(state)
    })

    obj.fruits(function (state) {
        fruitChanges.push(state)
    })

    obj.fruits.oranges.set(6)
    obj.customers.set(10)
    obj.fruits.apples.set(4)

    assert.equal(changes.length, 3)
    assert.equal(fruitChanges.length, 2)

    assert.notEqual(changes[0], initialState)
    assert.notEqual(changes[1], changes[0])
    assert.notEqual(changes[2], changes[1])

    assert.notEqual(fruitChanges[0], initialState.fruits)
    assert.notEqual(fruitChanges[1], fruitChanges[0])

    assert.deepEqual(initialState, {
        customers: 5,
        fruits: { apples: 3, oranges: 5 }
    })
    assert.deepEqual(changes[0], {
        customers: 5,
        fruits: { apples: 3, oranges: 6 }
    })
    assert.deepEqual(changes[1], {
        customers: 10,
        fruits: { apples: 3, oranges: 6 }
    })
    assert.deepEqual(changes[2], {
        customers: 10,
        fruits: { apples: 4, oranges: 6 }
    })

    assert.deepEqual(initialState.fruits, {
        apples: 3, oranges: 5
    })
    assert.deepEqual(fruitChanges[0], {
        apples: 3, oranges: 6
    })
    assert.deepEqual(fruitChanges[1], {
        apples: 4, oranges: 6
    })

    assert.equal(changes[1].fruits, changes[0].fruits,
        "unchanged properties are the same value")

    assert.end()
})
