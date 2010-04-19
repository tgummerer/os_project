#include <stdio.h>
#include <string.h>

int main (int args, char ** argv)
{
  char command [256];
  int pid;
  
  // Loop (nearly) forever
  for (;;) {
    printf("$ ");
    // Read a command from the console
    scanf("%s", command);

    // exit, if the command is exit
    if (strcmp ("exit", command) == 0) {
      break;
    }
    else {
      // fork to execute new program
      if (pid = fork() < 0) {
	printf("Fork failed, program exiting\n");
	break;
      } else if (pid == 0) {
	// Child
      } else {
	// Parent
      }
    }
  }
  
}
