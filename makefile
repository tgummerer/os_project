main: main.c child.o
	gcc -o main main.c child.o

child.o: child.c
	gcc -c -o child.o child.c

debug: 
	gcc -g -o main_debug main.c child.c

clean:
	rm main main_debug *.o