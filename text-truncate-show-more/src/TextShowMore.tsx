import React, { useCallback, useEffect, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextLayoutEventData,
  TextStyle,
  View
} from 'react-native';

interface IProps {
  children?: string;
  textStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  textShowMore?: string;
  textShowLess?: string;
  textShowMoreStyle?: StyleProp<TextStyle>;
  textShowLessStyle?: StyleProp<TextStyle>;
}

export const TextShowMore = React.memo((props: IProps) => {
  const { children, textStyle, numberOfLines, textShowLessStyle, textShowMoreStyle, textShowLess = 'Show less', textShowMore = 'Show more' } = props;
  const [expanded, setExpanded] = useState<boolean>(false); // current satate is expanded or not
  const [dontNeedToShowMore, setDontNeedToShowMore] = useState<boolean>(true); // check dont need btn 'show more'
  const [textNotExpanded, setTextNotExpanded] = useState<string | undefined>(); // text show when expanded = false
  const [textExpanded, setTextExpanded] = useState<string | undefined>(); // text show when expanded = true

  const toggleShowMore = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const changeTextNotExpanded = useCallback((text?: string) => {
    setTextNotExpanded(text);
  }, []);

  const changeTextExpanded = useCallback((text?: string) => {
    setTextExpanded(text);
  }, []);

  const changeDontNeedToShowMore = useCallback((dontNeed: boolean) => {
    setDontNeedToShowMore(dontNeed);
  }, []);

  const renderButtonMoreLess = useCallback(() => {
    if (dontNeedToShowMore) return;

    if (expanded) return <Text
      style={[styles.defaultStyleTextMore, textShowLessStyle]}
      suppressHighlighting={true}
      onPress={toggleShowMore}
    >
      {textShowLess}
    </Text>

    return <Text
      style={[styles.defaultStyleTextMore, textShowMoreStyle]}
      suppressHighlighting={true}
      onPress={toggleShowMore}
    >
      {textShowMore}
    </Text>
  }, [expanded, toggleShowMore, dontNeedToShowMore, textShowMore, textShowLess, textShowMoreStyle, textShowLessStyle]);

  return <>
    <Text style={[styles.defaultStyle, textStyle]}>
      {expanded ? textExpanded : textNotExpanded}
      {renderButtonMoreLess()}
    </Text>

    {/* clone raw text, full line */}
    <TextCloneCaculate
      changeTextNotExpanded={changeTextNotExpanded}
      changeTextExpanded={changeTextExpanded}
      changeDontNeedToShowMore={changeDontNeedToShowMore}
      textStyle={textStyle}
      numberOfLines={numberOfLines}
      textShowMore={textShowMore}
      textShowMoreStyle={textShowMoreStyle}
      textShowLess={textShowLess}
      textShowLessStyle={textShowLessStyle}
    >{children}</TextCloneCaculate>
  </>
});

// private components
interface ITextCloneCaculate extends IProps {
  changeTextNotExpanded: (text?: string) => void;
  changeTextExpanded: (text?: string) => void;
  changeDontNeedToShowMore: (value: boolean) => void;
}
const TextCloneCaculate = React.memo((props: ITextCloneCaculate) => {
  const { numberOfLines, textShowMoreStyle, textShowLessStyle, textShowMore, textShowLess, children, textStyle, changeTextNotExpanded, changeTextExpanded, changeDontNeedToShowMore } = props;
  const [textLineNormal, setTextLineNormal] = useState<string | undefined>();
  const [textLastLine, setTextLastLine] = useState<string | undefined>();
  const prevTextLastLine = React.useRef<string>('');
  const rawTextLastLine = React.useRef<string>('');

  const onTextLayoutClone = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = e.nativeEvent;
    // dont need to show more
    if (!numberOfLines || lines?.length <= numberOfLines) {
      changeDontNeedToShowMore(true);
      changeTextNotExpanded(children)
      return;
    }
    // need to show more
    changeDontNeedToShowMore(false);
    let textTruncateWillShow = '';
    lines.forEach((line, index) => {
      if (index < numberOfLines - 1) {
        textTruncateWillShow += line.text;
      }
      if (index === numberOfLines - 1) {
        setTextLastLine(line.text);
        rawTextLastLine.current = line.text;
      }
    });
    setTextLineNormal(textTruncateWillShow);
  }, [numberOfLines, children, changeDontNeedToShowMore, changeTextNotExpanded]);

  const onTextLayoutNotExpanded = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = e.nativeEvent;
    if (!lines) return;
    const textLastLine = lines?.[0]?.text;
    // caculate last line done
    if (lines?.length === 1) {
      changeTextNotExpanded(textLineNormal + prevTextLastLine.current.trim() + '...');
      return;
    }
    // caulate 
    const shorterListString = textLastLine?.split(' ').slice(0, -1);
    const shorterString = shorterListString.join(' ');
    setTextLastLine(shorterString);
    prevTextLastLine.current = textLastLine
  }, [textLineNormal, changeTextNotExpanded]);

  const onTextLayoutExpanded = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = e.nativeEvent;
    // case text show less in 2 lines
    if (numberOfLines && lines?.length > numberOfLines && textShowLess) {
      const textLastLine = lines[lines?.length - 1]?.text;
      const textShowLessIn2Lines = textLastLine.length < textShowLess.length && textShowLess.includes(textLastLine)
      if (textShowLessIn2Lines) {
        changeTextExpanded(children + '\n')
        return
      }
    }

    // case happy
    changeTextExpanded(children)
  }, [numberOfLines, changeTextExpanded, children]);

  useEffect(() => {
    setTextLastLine(rawTextLastLine.current);
  }, [textShowMore, textShowLess]);

  return (
    <View style={styles.viewClone} pointerEvents='none'>
      {/* raw to get all lines */}
      <Text
        numberOfLines={numberOfLines ? numberOfLines + 1 : undefined}
        onTextLayout={onTextLayoutClone}
        style={[styles.defaultStyle, textStyle]}
      >
        {children}
      </Text>

      {/* process state = has show more */}
      <Text style={[styles.defaultStyle, textStyle]}
        onTextLayout={onTextLayoutNotExpanded}
      >
        {textLastLine}{'...'}
        <Text
          style={[styles.defaultStyleTextMore, textShowMoreStyle]}
        >
          {textShowMore}
        </Text>
      </Text>
      <View style={styles.viewStroke} />

      {/* process state = has show less */}
      <Text style={[styles.defaultStyle, textStyle]}
        onTextLayout={onTextLayoutExpanded}
      >
        {children}
        <Text
          style={[styles.defaultStyleTextMore, textShowLessStyle]}
        >
          {textShowLess}
        </Text>
      </Text>
    </View>
  );
})

// styles
const styles = StyleSheet.create({
  defaultStyle: {
    fontSize: 14,
    color: 'black',
    fontFamily: 'monospace',
  },
  defaultStyleTextMore: {
    fontSize: 14,
    color: 'black',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  viewClone: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
  },
  viewStroke: {
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    width: '100%',
    height: 1,
    marginBottom: 10,
  },
});

export default TextShowMore;
