
observ-struct := (Object<String, Observ<T>>) => 
    Observ<Object<String, T>> & Object<String, Observ<T>>
