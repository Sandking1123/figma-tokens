import React from 'react';
import { styled } from '@/stitches.config';

const StyledStack = styled('div', {
  display: 'flex',
  variants: {
    direction: {
      row: {
        flexDirection: 'row',
      },
      column: {
        flexDirection: 'column',
      },
    },
    align: {
      center: {
        alignItems: 'center',
      },
      start: {
        alignItems: 'flex-start',
      },
      end: {
        alignItems: 'flex-end',
      },
    },
    justify: {
      center: {
        justifyContent: 'center',
      },
      start: {
        justifyContent: 'flex-start',
      },
      end: {
        justifyContent: 'flex-end',
      },
      between: {
        justifyContent: 'space-between',
      },
    },
    gap: {
      0: {
        gap: 0,
      },
      1: {
        gap: '$1',
      },
      2: {
        gap: '$2',
      },
      3: {
        gap: '$3',
      },
      4: {
        gap: '$4',
      },
    },
    width: {
      full: {
        width: '100%',
      },
    },
  },
});

type StackProps = {
  gap: 0 | 1 | 2 | 3 | 4;
  direction: 'row' | 'column';
  align?: 'center' | 'start' | 'end';
  justify?: 'center' | 'start' | 'end' | 'between';
  width?: 'full';
  children: React.ReactNode;
};

export default function Stack({
  gap, direction, align = 'start', justify = 'start', width, children,
}: StackProps) {
  return (
    <StyledStack gap={gap} direction={direction} align={align} justify={justify} width={width}>
      {children}
    </StyledStack>
  );
}
