#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>

#include "def.h"
#include "child.h"
#include "parent.h"



int main (int args, char ** argv)
{
  char command [MAX_COMMAND_LENGTH];
  pid_t pid;
  
  // Loop (nearly) forever
  for (;;) {
    printf("$ ");
    
    // Read a command from the console
    fgets(command, MAX_COMMAND_LENGTH, stdin);
    // Remove trailing \n
    sscanf(command, "%s", command);
    
    // exit, if the command is exit
    if (strcmp ("exit", command) == 0) {
      break;
    }
    else {
      // fork to execute new program
      pid = fork ();
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
