cmd_Release/obj.target/native_metrics.node := g++ -shared -pthread -rdynamic -m64  -Wl,-soname=native_metrics.node -o Release/obj.target/native_metrics.node -Wl,--start-group Release/obj.target/native_metrics/src/native_metrics.o Release/obj.target/native_metrics/src/GCBinder.o Release/obj.target/native_metrics/src/LoopChecker.o Release/obj.target/native_metrics/src/RUsageMeter.o -Wl,--end-group 