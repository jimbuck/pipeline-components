import React, { PropsWithChildren } from 'react';


export function flattenChildren(children: React.ReactNode): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      if (child.type === React.Fragment) {
        out.push(...flattenChildren((child.props as PropsWithChildren).children));
      } else {
        out.push(child);
      }
    }
  });
  return out;
}

export function resolveElement(element: React.ReactElement, isPrimitiveComponent: (type: unknown) => boolean): React.ReactElement | null {
  if (typeof element.type === 'function' && !isPrimitiveComponent(element.type)) {
    // Custom component: handle function and class components
    if (element.type.prototype && element.type.prototype.isReactComponent) {
      // Class component
      const instance = new (element.type as new (props: unknown) => React.Component)(element.props);
      return instance.render() as React.ReactElement;
    } else {
      // Function component
      return (element.type as (props: unknown) => React.ReactElement)(element.props);
    }
  }
  return element;
}

export function renderElementToString(element: React.ReactElement): string {
  // If it's a function component, call it to get its return value
  if (typeof element.type === 'function') {
    let rendered: React.ReactNode;

    // Check if it's a class component or function component
    if (element.type.prototype && element.type.prototype.isReactComponent) {
    // Class component
      const ComponentClass = element.type as new (props: unknown) => React.Component;
      const instance = new ComponentClass(element.props);
      rendered = instance.render();
    } else {
      // Function component
      const FunctionComponent = element.type as (props: unknown) => React.ReactNode;
      rendered = FunctionComponent(element.props);
    }

    if (typeof rendered === 'string') {
      return rendered;
    } else if (rendered === null || rendered === undefined) {
      return '';
    } else if (React.isValidElement(rendered)) {
      // Handle Fragment specifically
      if (rendered.type === React.Fragment) {
        const children = (rendered.props as PropsWithChildren).children;
        return React.Children.toArray(children).map(child => {
          if (typeof child === 'string') {
            return child;
          } else if (React.isValidElement(child)) {
            return renderElementToString(child);
          } else {
            return String(child);
          }
        }).join('\n');
      } else {
        return renderElementToString(rendered);
      }
    } else if (rendered !== null && rendered !== undefined) {
      // Handle other React nodes (arrays, etc.)
      return React.Children.toArray(rendered).map(child => {
        if (typeof child === 'string') {
          return child;
        } else if (React.isValidElement(child)) {
          return renderElementToString(child);
        } else {
          return String(child);
        }
      }).join('\n');
    }
  }

  // Fallback: convert to string
  return String(element);
}

export function renderChildrenToString(children: React.ReactNode): string | undefined {
  if (typeof children === 'string') {
    // Handle multiline strings by trimming and preserving line breaks
    const lines = children.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const result = lines.length > 1 ? lines.join('\n') : children;
    return result;
  } else if (Array.isArray(children)) {
    // Handle array of mixed content (strings and React elements)
    return children.map(child => {
      if (typeof child === 'string') {
        return child;
      } else if (React.isValidElement(child)) {
        // Render React element to get its content
        return renderElementToString(child);
      } else {
        return String(child);
      }
    }).join('\n');
  } else if (React.isValidElement(children)) {
    // Handle single React element
    return renderElementToString(children);
  } else if (children !== undefined && children !== null) {
    // Handles interpolated expressions or other primitives
    return String(children);
  }

  // Return undefined for null/undefined children
  return undefined;
}