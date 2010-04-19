#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include "child.h"

int main (int args, char ** argv)
{
  char command [256];
  pid_t pid;
  
  // Loop (nearly) forever
  for (;;) {
    printf("$ ");
    //command = "";
    // Read a command from the console
    scanf("%s", command);
    printf ("__%s__", command);
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
	// execute child method in child.c
        child (command);
	exit(1); // end the child
      } else {
	// parent
	wait (NULL);
	printf("parent\n");
      }
    }
  }
}
