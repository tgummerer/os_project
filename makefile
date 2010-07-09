CC = gcc

BIN = shell
OBJS = main.o child.o parent.o sighandlers.o commands.o
CFLAGS=

$(BIN): $(OBJS)
	$(CC) -o $(BIN) $(OBJS)

main.o: main.c

child.o: child.c child.h def.h

parent.o: parent.c parent.h

sighandlers.o: sighandlers.c sighandlers.h

commands.o: commands.c commands.h

clean:
	rm $(BIN) $(OBJS) *~
