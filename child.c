#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>


#include "child.h"
#include "def.h"

char * argv[MAX_COMMAND_LENGTH];
char * sep = " \t\n";
char * element;

// command is closed by \0
int child (char command []) {
  int argc=0;

  element = strtok (command, sep);
  while (element != NULL)
    {
      argv[argc] = element;
      //  printf ("Argument n %d:\t%s\n", argc, argv[argc]);
      argc++;
      argv[argc]=NULL;
      element = strtok(NULL, sep);
    }
  //  printf ("Argument n %d:\t%s\n", argc, argv[argc]);

  //  printf ("\n ... and now I will try to execute the command %s with its arguments\n", argv[0]);
  
  // Execute command
  execvp (argv[0], argv);
  perror("Command was not found ");
  return EXIT_FAILURE;
}

