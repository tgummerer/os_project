#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include "child.h"
#include "parent.h"

#define MAX_COMMAND_LENGTH 256

int main (int args, char ** argv)
{
  char command [MAX_COMMAND_LENGTH];
  pid_t pid;
  
  // Loop (nearly) forever
  for (;;) {
    printf("$ ");
    //command = "";
    // Read a command from the console
    fgets(command, MAX_COMMAND_LENGTH, stdin);
    // exit, if the command is exit
    if (strcmp ("exit", command) == 0) {
      break;
    }
    else {
      // fork to execute new program
      pid = fork ();
      printf("%i", pid);
      if (pid < 0) {
	printf("Fork failed, program exiting\n");
	break;
	
      } else if (pid == 0) {
	// Child in child.c
        child (command);
	exit(1); // end the child
      } else {
	// Parent in parent.c
	parent();
      }
    }
  }
}
