import React, { useCallback, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextLayoutEventData,
  TextStyle,
  View,
} from 'react-native';

interface IProps {
  children?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const TextTruncate = React.memo((props: IProps) => {
  const { children, style, numberOfLines } = props;
  const [textTruncate, setTextTruncate] = useState<string | undefined>();

  const onTextLayoutClone = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = e.nativeEvent;
    // dont need to show more
    if (!numberOfLines || lines?.length <= numberOfLines) {
      setTextTruncate(children)
      return;
    }
    // need to show more
    let textTruncateWillShow = '';
    lines.forEach((line, index) => {
      if (index <= numberOfLines - 1) {
        textTruncateWillShow += line.text;
      }
    });
    setTextTruncate(textTruncateWillShow?.trim());
  }, [numberOfLines, children]);

  return <>
    <Text style={[styles.defaultStyle, style]}>{textTruncate}</Text>

    {/* clone raw text, full line */}
    <View style={styles.viewClone} pointerEvents='none'>
      <Text
        numberOfLines={numberOfLines ? numberOfLines + 1 : undefined}
        onTextLayout={onTextLayoutClone}
        style={[styles.defaultStyle, style]}
      >
        {children}
      </Text>
    </View>
  </>
});

const styles = StyleSheet.create({
  defaultStyle: {
    fontSize: 14,
    color: 'black',
    fontFamily: 'monospace',
  },
  viewClone: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
  },
});

export default TextTruncate;