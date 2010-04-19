#include <stdio.h>

int main (int args, char ** argv)
{
  char command [255];
  
  printf("$ ");
  scanf("%s", command);

  printf("%s\n", command);
}
