#include <string.h>
#include <stdio.h>

#include "commands.h"
#include "parent.h"

void internal (char command[])
{
  if (strcmp("jobs\n", command) == 0) {
    show_proc_list();  
  }

  if (strncmp("bg", command, 2) == 0) {
    background(command);
  }

  if (strncmp("fg", command, 2) == 0) {
    foreground(command);
  }
}

void background (char command[])
{
  // Run process in background
}

void foreground (char comman[])
{
  // Run process in foreground
}
