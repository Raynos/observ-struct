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
        foo: "foo", bar: "bar",
    })
    assert.deepEqual(changes[0]._diff, { "foo": "foo" })
    assert.deepEqual(changes[1], {
        foo: "foo2", bar: "bar"
    })
    assert.deepEqual(changes[1]._diff, { "foo": "foo2" })
    assert.deepEqual(changes[2], {
        foo: "foo2", bar: "bar2"
    })
    assert.deepEqual(changes[2]._diff, { "bar": "bar2" })
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
    assert.deepEqual(changes[0]._diff, { fruits: { oranges: 6 } })
    assert.deepEqual(changes[0].fruits._diff, { "oranges": 6 })
    assert.deepEqual(changes[1], {
        customers: 10,
        fruits: { apples: 3, oranges: 6 }
    })
    assert.deepEqual(changes[1]._diff, { customers: 10 })
    assert.deepEqual(changes[1].fruits._diff, { oranges: 6 })
    assert.deepEqual(changes[2], {
        customers: 10,
        fruits: { apples: 4, oranges: 6 }
    })
    assert.deepEqual(changes[2]._diff, { fruits: { apples: 4 } })
    assert.deepEqual(changes[2].fruits._diff, { apples: 4 })

    assert.deepEqual(initialState.fruits, {
        apples: 3, oranges: 5
    })
    assert.deepEqual(fruitChanges[0], {
        apples: 3, oranges: 6
    })
    assert.deepEqual(fruitChanges[0]._diff, { oranges: 6 })
    assert.deepEqual(fruitChanges[1], {
        apples: 4, oranges: 6
    })
    assert.deepEqual(fruitChanges[1]._diff, { apples: 4 })

    assert.equal(changes[1].fruits, changes[0].fruits,
        "unchanged properties are the same value")

    assert.end()
})

test("observ struct with blackList", function t(assert) {
    assert.throws(function () {
        ObservHash({
            name: Observ("foo")
        });
    }, /cannot create/);

    assert.throws(function () {
        ObservHash({
            length: Observ("foo")
        });
    }, /cannot create/);

    assert.end()
})

test("supports two way data binding", function t(assert) {
    var obs = ObservHash({
        foo: Observ("bar")
    });

    obs.foo.set("bar2")

    assert.equal(obs().foo, "bar2")
    assert.equal(obs.foo(), "bar2")

    obs.set({ foo: "bar3" })

    assert.equal(obs().foo, "bar3")
    assert.equal(obs.foo(), "bar3")

    assert.end()
})

test("two way data binding doesnt emit twice", function t(assert) {
    var obs = ObservHash({
        foo: Observ("bar")
    })

    var values = []
    obs.foo(function (v) {
        values.push(v)
    })

    obs.set({ foo: "bar2" })
    obs.set({ foo: "bar2" })

    assert.equal(values.length, 1)
    assert.equal(values[0], "bar2")

    assert.end()
})

test("support plain values", function t(assert) {
    var obs = ObservHash({
        foo: Observ("bar"),
        baz: "plain value"
    })

    obs.set({ foo: "bar2", baz: "plain value" })

    assert.equal(obs().foo, "bar2")
    assert.equal(obs().baz, "plain value")
    assert.equal(obs.foo(), "bar2")

    assert.end()
})


test("_diff is correct with 2way bind", function t(assert) {
    var obs = ObservHash({
        foo: Observ("bar")
    })

    var values = []
    obs(function (v) {
        values.push(v)
    })

    obs.set({ foo: "bar2" })

    assert.equal(obs().foo, "bar2")
    assert.equal(obs.foo(), "bar2")

    assert.equal(values.length, 1)
    assert.deepEqual(values[0], {
        foo: "bar2"
    })
    assert.deepEqual(values[0]._diff, { foo: "bar2" })

    assert.end()
})
