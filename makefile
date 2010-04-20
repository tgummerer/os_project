main: main.c child.o parent.o def.h sighandlers.o
	gcc -o main main.c child.o parent.o sighandlers.o

child.o: child.c child.h def.h
	gcc -c -o child.o child.c

parent.o: parent.c parent.h
	gcc -c -o parent.o parent.c

sighandlers.o: sighandlers.c sighandlers.h
	gcc -c -o sighandlers.o sighandlers.c

clean:
	rm main main_debug *.o