#include <stdio.h>
#include "child.h"


// command is closed by \n\0
void child (char command []) {
  printf("%s", command);
  return;
}
