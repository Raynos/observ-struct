var Observ = require("observ")
var extend = require("xtend")

var blackList = {
    "length": "Clashes with `Function.prototype.length`.\n",
    "name": "Clashes with `Function.prototype.name`.\n",
    "_diff": "_diff is reserved key of observ-struct.\n",
    "_type": "_type is reserved key of observ-struct.\n",
    "_version": "_version is reserved key of observ-struct.\n"
}
var NO_TRANSACTION = {}

function setNonEnumerable(object, key, value) {
    Object.defineProperty(object, key, {
        value: value,
        writable: true,
        configurable: true,
        enumerable: false
    })
}

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
    var currentTransaction = NO_TRANSACTION
    var nestedTransaction = NO_TRANSACTION

    /* Create a flattened struct in initialState
     */
    keys.forEach(function (key) {
        if (blackList.hasOwnProperty(key)) {
            throw new Error("cannot create an observ-struct " +
                "with a key named '" + key + "'.\n" +
                blackList[key]);
        }

        var observ = struct[key]
        initialState[key] = typeof observ === "function" ?
            observ() : observ
    })

    /* Create an Observ where the value is the flattened initialState
     */
    var obs = Observ(initialState)

    keys.forEach(function (key) {

        /* For each key, set a property in the Observ to the value of the key,
         * observable or otherwise.
         */
        var observ = struct[key]
        obs[key] = observ

        if (typeof observ === "function") {

            /* If the value is an observable, observe it
             */
            observ(function valueChanged(value) {

                /* The nestedTransaction is set when we're copying in new
                 * values into our observables.  This allows us to distinguish
                 * between actual changes in the values and changes performed
                 * by us.
                 */
                if (nestedTransaction === value) {
                    return
                }

                /* Create a copy of the struct with the new value set
                 */
                var state = extend(obs())
                state[key] = value

                /* If the value was set by obs.set, the _diff property will
                 * be set to the original value.  So we can set the _diff
                 * property in the copy to note what's been changed.
                 */
                var diff = {}

                diff[key] = value && value._diff ?
                    value._diff : value

                setNonEnumerable(state, "_diff", diff)

                /* Setting obs will fire our structChanged listener, so set
                 * currentTransaction to stop it from trying to do anything
                 * clever.
                 */
                currentTransaction = state
                obs.set(state)
                currentTransaction = NO_TRANSACTION
            })
        }
    })

    var _set = obs.set

    /* Overridden set to set the ObservStruct to a new structure.
     */
    obs.set = function trackDiff(value) {

        /* If setting to the currentTransaction, just call the default Observ
         * set function.
         */
        if (currentTransaction === value) {
            return _set(value)
        }

        /* Copy the new value and set a _diff property on it with the original
         * non-copied value.
         */
        var newState = extend(value)
        setNonEnumerable(newState, "_diff", value)

        /* Call the default set Observ function with the new state, which
         * includes the _diff property.  This will fire the structChanged
         * listener below.
         */
        _set(newState)
    }

    /* Observe the ObservStruct itself.  This will fire when the ObservStruct
     * is set to a new structure, e.g. by the set function above.
     */
    obs(function structChanged(newState) {

        /* If currentTransaction is the same as newState, we're already in the
         * process of setting a changed value in the struct in response to
         * an observable we're storing changing.  So there's nothing to do.
         */
        if (currentTransaction === newState) {
            return
        }

        /* currentTransaction is not the same as newState, so the ObservStruct
         * has really been changed to a new struct.  Plain old values will be
         * fine, but we need to set any observables inside the ObservStruct to
         * the new values so that they can be updated & their listeners can
         * propagate.
         */
        keys.forEach(function(key) {
            var observ = struct[key]
            var newObservValue = newState[key]

            /* Is it a) an observable and b) is the value different?
             */
            if (typeof observ === "function" &&
                observ() !== newObservValue
            ) {
                /* Setting the value will fire our own listener on the
                 * observable.  Setting nestedTransaction allows us to ignore
                 * this, because we're performingt the setting ourselves.
                 */
                nestedTransaction = newObservValue
                observ.set(newState[key])
                nestedTransaction = NO_TRANSACTION
            }
        })
    })

    obs._type = "observ-struct"
    obs._version = "5"

    return obs
}
