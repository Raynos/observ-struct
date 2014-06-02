var Observ = require("observ")
var extend = require("xtend")

/* ObservStruct := (Object<String, Observ<T>>) => 
    Object<String, Observ<T>> &
        Observ<Object<String, T> & {
            _diff: Object<String, Any>
        }>

*/
module.exports = ObservStruct

function ObservStruct(struct) {
    var keys = Object.keys(struct)

    var initialState = {}

    keys.forEach(function (key) {
        if (key === "name") {
            throw new Error("cannot create an observ-struct " +
                "with a key named 'name'. Clashes with " +
                "`Function.prototype.name`.");
        }

        var observ = struct[key]
        initialState[key] = typeof observ === "function" ?
            observ() : observ
    })

    var obs = Observ(initialState)
    keys.forEach(function (key) {
        var observ = struct[key]
        obs[key] = observ

        if (typeof observ === "function") {
            observ(function (value) {
                var state = extend(obs())
                state[key] = value
                var diff = {}
                diff[key] = value && value._diff ?
                    value._diff : value
                state._diff = diff
                obs.set(state)
            })
        }
    })

    return obs
}
