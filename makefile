main: main.c child.o parent.o
	gcc -o main main.c child.o

child.o: child.c child.h
	gcc -c -o child.o child.c

parent.o: parent.c parent.h
	gcc -c -o parent.o parent.c

debug: 
	gcc -g -o main_debug main.c child.c

clean:
	rm main main_debug *.o