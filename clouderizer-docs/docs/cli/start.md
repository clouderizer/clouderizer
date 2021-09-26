An existing project can be started or restarted with new configuration using ```cldz start```.

```cldz start PROJECT_NAME```

One flag accepted by ```cldz start``` is the type of --infra you want to run on. 

Clouderizer currently supports 3 infra types:standard, highmemory and gpu.

standard infra type is selected by default but if you want to start a project on gpu 

```cldz start PROJECT_NAME --infra gpu```