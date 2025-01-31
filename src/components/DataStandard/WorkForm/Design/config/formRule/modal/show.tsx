import React, { useEffect, useState } from 'react';
import { Field } from 'devextreme/ui/filter_builder';
import { FilterBuilder } from 'devextreme-react/filter-builder';
import { Modal } from 'antd';
import { SelectBox, TextArea, TextBox } from 'devextreme-react';
import { model } from '@/ts/base';
import { getUuid } from '@/utils/tools';

interface IProps {
  fields: Field[];
  current?: model.FormShowRule;
  onOk: (rule: model.FormShowRule) => void;
  onCancel: () => void;
}

const ShowRuleModal: React.FC<IProps> = (props) => {
  const [name, setName] = useState<string>();
  const [remark, setRemark] = useState<string>();
  const [target, setTarget] = useState<string>();
  const [showType, setShowType] = useState<string>();
  const [value, setValue] = useState<boolean>();
  const [condition, setCondition] = useState<any[]>([]);
  useEffect(() => {
    if (props.current) {
      setName(props.current.name);
      setRemark(props.current.remark);
      setTarget(props.current.target);
      setValue(props.current.value);
      setShowType(props.current.showType);
      setCondition(JSON.parse(props.current?.condition || '[]'));
    }
  }, [props.current]);
  const vaildDisable = () => {
    return (
      name == undefined ||
      target == undefined ||
      value == undefined ||
      showType == undefined ||
      condition == undefined ||
      condition.length < 1
    );
  };
  return (
    <Modal
      destroyOnClose
      title={'渲染规则'}
      open={true}
      onOk={() => {
        const getString = (datas: any[]) => {
          const ret: string[] = [];
          for (const data of datas) {
            if (typeof data == 'string') {
              ret.push(data);
            } else if (Array.isArray(data)) {
              ret.push(...getString(data));
            }
          }
          return ret;
        };
        props.onOk.apply(this, [
          {
            id: props.current?.id ?? getUuid(),
            name: name!,
            remark: remark ?? '',
            target: target!,
            showType: showType!,
            value: value!,
            condition: JSON.stringify(condition),
            type: 'show',
            trigger: getString(condition),
          },
        ]);
      }}
      onCancel={props.onCancel}
      okButtonProps={{
        disabled: vaildDisable(),
      }}>
      <TextBox
        label="名称*"
        labelMode="floating"
        value={name}
        onValueChange={(e) => {
          setName(e);
        }}
      />
      <SelectBox
        label="目标*"
        labelMode="floating"
        value={target}
        showClearButton
        displayExpr="caption"
        valueExpr="name"
        dataSource={props.fields}
        onSelectionChanged={(e) => {
          setTarget(e.selectedItem['name']);
        }}
      />
      <div>
        <SelectBox
          width={'60%'}
          value={showType}
          label="类型*"
          showClearButton
          labelMode="floating"
          displayExpr="label"
          valueExpr="value"
          style={{ display: 'inline-block' }}
          dataSource={[
            { label: '是否展示', value: 'visible' },
            { label: '是否必填', value: 'isRequired' },
          ]}
          onSelectionChanged={(e) => {
            setShowType(e.selectedItem['value']);
          }}
        />
        <SelectBox
          width={'40%'}
          value={value}
          label="值*"
          showClearButton
          labelMode="floating"
          style={{ display: 'inline-block' }}
          dataSource={[
            { label: '是', value: true },
            { label: '否', value: false },
          ]}
          displayExpr="label"
          valueExpr="value"
          onSelectionChanged={(e) => {
            setValue(e.selectedItem['value']);
          }}
        />
      </div>
      <div style={{ padding: 5 }}>
        <span>条件*：</span>
        <FilterBuilder
          fields={props.fields}
          value={condition}
          groupOperations={['and', 'or']}
          onValueChanged={(e) => {
            setCondition(e.value);
          }}
        />
      </div>
      <TextArea
        label="备注"
        labelMode="floating"
        onValueChanged={(e) => {
          setRemark(e.value);
        }}
        value={remark}
      />
    </Modal>
  );
};
export default ShowRuleModal;
